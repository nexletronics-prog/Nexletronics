import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
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
  useAuth,
} from "../../hooks/useAuth";

import {
  useCart,
} from "../../contexts/CartContext";

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface RazorpayAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  companyName?: string;
  gstin?: string;
}

interface RazorpayCreateOrderResponse {
  success: boolean;
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    sku?: string;
  }>;
  error?: string;
}

interface RazorpayVerifyResponse {
  success: boolean;
  verified: boolean;
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus?: string;
  error?: string;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (
    response: RazorpayPaymentResponse,
  ) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };
  retry?: {
    enabled: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on?: (
    event: string,
    callback: (response: unknown) => void,
  ) => void;
}

interface RazorpayConstructor {
  new (
    options: RazorpayOptions,
  ): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const initialForm: CheckoutForm = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

function formatPrice(value: number): string {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function createEmptyAddress(): RazorpayAddress {
  return {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    companyName: "",
    gstin: "",
  };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true),
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  disabled = false,
  maxLength,
  autoComplete,
  inputMode,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  autoComplete?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-neutral-800"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
      />
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();

  const totalItems = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + item.quantity,
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
    billingForm,
    setBillingForm,
  ] = useState<RazorpayAddress>(
    createEmptyAddress(),
  );

  const [
    billingSameAsShipping,
    setBillingSameAsShipping,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  function updateField(
    field: keyof CheckoutForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function updateBillingField(
    field: keyof RazorpayAddress,
    value: string,
  ) {
    setBillingForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function validateForm(): string {
    if (!user) {
      return "Please log in before checkout.";
    }

    if (form.name.trim().length < 2) {
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
      form.phone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      return "Please enter a valid phone number.";
    }

    if (
      form.address.trim().length < 8
    ) {
      return "Please enter your complete delivery address.";
    }

    if (
      form.city.trim().length < 2
    ) {
      return "Please enter your city.";
    }

    if (
      form.state.trim().length < 2
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

    if (
      !form.country.trim()
    ) {
      return "Please enter your country.";
    }

    if (!billingSameAsShipping) {
      if (
        billingForm.name.trim().length < 2
      ) {
        return "Please enter the billing name.";
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          billingForm.email.trim(),
        )
      ) {
        return "Please enter a valid billing email.";
      }

      if (
        billingForm.address.trim().length < 8
      ) {
        return "Please enter the complete billing address.";
      }

      if (
        billingForm.city.trim().length < 2
      ) {
        return "Please enter the billing city.";
      }

      if (
        billingForm.state.trim().length < 2
      ) {
        return "Please enter the billing state.";
      }

      if (
        !/^\d{6}$/.test(
          billingForm.pincode.trim(),
        )
      ) {
        return "Please enter a valid billing PIN code.";
      }
    }

    return "";
  }

  async function getIdToken(): Promise<string> {
    if (!user) {
      throw new Error(
        "Please log in before checkout.",
      );
    }

    return user.getIdToken();
  }

  async function createRazorpayOrder(): Promise<RazorpayCreateOrderResponse> {
    const idToken =
      await getIdToken();

    const orderItems =
      cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

    const shippingAddress =
      {
        name: form.name.trim(),
        email:
          form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        companyName:
          form.companyName.trim(),
        address:
          form.address.trim(),
        city:
          form.city.trim(),
        state:
          form.state.trim(),
        pincode:
          form.pincode.trim(),
        country:
          form.country.trim() ||
          "India",
      };

    const billingAddress =
      billingSameAsShipping
        ? shippingAddress
        : {
            name:
              billingForm.name.trim(),
            email:
              billingForm.email
                .trim()
                .toLowerCase(),
            phone:
              billingForm.phone.trim(),
            companyName:
              (
                billingForm.companyName ??
                ""
              ).trim(),
            address:
              billingForm.address.trim(),
            city:
              billingForm.city.trim(),
            state:
              billingForm.state.trim(),
            pincode:
              billingForm.pincode.trim(),
            country:
              billingForm.country.trim() ||
              "India",
            gstin:
              (
                billingForm.gstin ??
                ""
              ).trim(),
          };

    const response =
      await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            items: orderItems,
            customer: {
              name:
                form.name.trim(),
              email:
                form.email
                  .trim()
                  .toLowerCase(),
              phone:
                form.phone.trim(),
            },
            shippingAddress,
            billingAddress,
            billingAddressSameAsShipping:
              billingSameAsShipping,
          }),
        },
      );

    const data =
      (await response.json()) as
        | RazorpayCreateOrderResponse
        | { error?: string };

    if (
      !response.ok ||
      !("success" in data) ||
      data.success !== true
    ) {
      throw new Error(
        "error" in data &&
        data.error
          ? data.error
          : "Unable to create the payment order.",
      );
    }

    return data;
  }

  async function verifyRazorpayPayment(
    paymentResponse: RazorpayPaymentResponse,
  ): Promise<RazorpayVerifyResponse> {
    const idToken =
      await getIdToken();

    const response =
      await fetch(
        "/api/razorpay/verify-payment",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            razorpay_order_id:
              paymentResponse.razorpay_order_id,
            razorpay_payment_id:
              paymentResponse.razorpay_payment_id,
            razorpay_signature:
              paymentResponse.razorpay_signature,
          }),
        },
      );

    const data =
      (await response.json()) as
        RazorpayVerifyResponse;

    if (
      !response.ok ||
      !data.success ||
      !data.verified
    ) {
      throw new Error(
        data.error ||
          "Payment verification failed.",
      );
    }

    return data;
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (saving) {
      return;
    }

    if (!user) {
      setError(
        "Please log in before checkout.",
      );
      return;
    }

    if (cartItems.length === 0) {
      setError(
        "Your cart is empty.",
      );
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const razorpayLoaded =
        await loadRazorpayScript();

      if (
        !razorpayLoaded ||
        !window.Razorpay
      ) {
        throw new Error(
          "Unable to load Razorpay Checkout. Please check your internet connection and try again.",
        );
      }

      const order =
        await createRazorpayOrder();

      const razorpay =
        new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Nexletronics",
          description:
            `Order with ${totalItems} item${
              totalItems === 1
                ? ""
                : "s"
            }`,
          order_id:
            order.orderId,

          prefill: {
            name:
              form.name.trim(),
            email:
              form.email
                .trim()
                .toLowerCase(),
            contact:
              form.phone.trim(),
          },

          notes: {
            source:
              "nexletronics-checkout",
            customerEmail:
              form.email
                .trim()
                .toLowerCase(),
          },

          theme: {
            color:
              "#D4AF37",
          },

          retry: {
            enabled: true,
          },

          modal: {
            confirm_close: true,

            ondismiss: () => {
              setSaving(false);
            },
          },

          handler:
            async (
              paymentResponse,
            ) => {
              try {
                setError("");
                setSaving(true);

                const verification =
                  await verifyRazorpayPayment(
                    paymentResponse,
                  );

                if (
                  !verification.orderId
                ) {
                  throw new Error(
                    "Payment was verified, but the order ID was not returned.",
                  );
                }

                sessionStorage.setItem(
                  "nexletronics-last-order",
                  JSON.stringify({
                    orderId:
                      verification.orderId,

                    razorpayOrderId:
                      verification.razorpayOrderId ??
                      paymentResponse.razorpay_order_id,

                    razorpayPaymentId:
                      verification.razorpayPaymentId ??
                      paymentResponse.razorpay_payment_id,

                    subtotal:
                      order.totals.subtotal,

                    shipping:
                      order.totals.shipping,

                    tax:
                      order.totals.tax,

                    discount:
                      order.totals.discount,

                    total:
                      order.totals.total,
                  }),
                );

                clearCart();

                navigate(
                  `/checkout/success?orderId=${encodeURIComponent(
                    verification.orderId,
                  )}`,
                  {
                    replace: true,
                  },
                );
              } catch (
                verificationError
              ) {
                console.error(
                  "Payment verification failed:",
                  verificationError,
                );

                setError(
                  verificationError instanceof
                    Error
                    ? verificationError.message
                    : "Payment verification failed. Please contact support.",
                );

                setSaving(false);
              }
            },
        });

      if (
        typeof razorpay.on ===
        "function"
      ) {
        razorpay.on(
          "payment.failed",
          (
            response: unknown,
          ) => {
            console.error(
              "Razorpay payment failed:",
              response,
            );

            setError(
              "Payment failed or was cancelled. Your cart has not been cleared. Please try again.",
            );

            setSaving(false);
          },
        );
      }

      razorpay.open();
    } catch (submitError) {
      console.error(
        "Checkout failed:",
        submitError,
      );

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to start checkout. Please try again.",
      );

      setSaving(false);
    }
  }

  if (
    cartItems.length === 0
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
            Your cart is currently empty.
            Add products before continuing
            to checkout.
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
            Enter your delivery and billing
            information below. Your payment
            will be processed securely through
            Razorpay.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={submit}
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
              <div className="sm:col-span-2">
                <Field
                  label="Full Name"
                  id="checkout-name"
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value,
                    )
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  disabled={saving}
                />
              </div>

              <Field
                label="Email Address"
                id="checkout-email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField(
                    "email",
                    value,
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={saving}
              />

              <Field
                label="Phone Number"
                id="checkout-phone"
                type="tel"
                value={form.phone}
                onChange={(value) =>
                  updateField(
                    "phone",
                    value,
                  )
                }
                placeholder="10-digit phone number"
                autoComplete="tel"
                inputMode="tel"
                disabled={saving}
              />

              <div className="sm:col-span-2">
                <Field
                  label="Company Name (Optional)"
                  id="checkout-company"
                  required={false}
                  value={
                    form.companyName
                  }
                  onChange={(value) =>
                    updateField(
                      "companyName",
                      value,
                    )
                  }
                  placeholder="Company / business name"
                  autoComplete="organization"
                  disabled={saving}
                />
              </div>

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
                  value={form.address}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="House / Flat number, street, area"
                  disabled={saving}
                  className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />
              </div>

              <Field
                label="City"
                id="checkout-city"
                value={form.city}
                onChange={(value) =>
                  updateField(
                    "city",
                    value,
                  )
                }
                placeholder="Bengaluru"
                autoComplete="address-level2"
                disabled={saving}
              />

              <Field
                label="State"
                id="checkout-state"
                value={form.state}
                onChange={(value) =>
                  updateField(
                    "state",
                    value,
                  )
                }
                placeholder="Karnataka"
                autoComplete="address-level1"
                disabled={saving}
              />

              <Field
                label="PIN Code"
                id="checkout-pincode"
                value={form.pincode}
                onChange={(value) =>
                  updateField(
                    "pincode",
                    value.replace(
                      /\D/g,
                      "",
                    ),
                  )
                }
                placeholder="560001"
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={6}
                disabled={saving}
              />

              <Field
                label="Country"
                id="checkout-country"
                value={form.country}
                onChange={(value) =>
                  updateField(
                    "country",
                    value,
                  )
                }
                placeholder="India"
                autoComplete="country-name"
                disabled={saving}
              />
            </div>

            <div className="mt-10 border-t border-neutral-200 pt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                    Billing
                  </p>

                  <h2 className="mt-1 text-xl font-black text-neutral-950">
                    Billing Details
                  </h2>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4">
                <input
                  type="checkbox"
                  checked={
                    billingSameAsShipping
                  }
                  onChange={(event) =>
                    setBillingSameAsShipping(
                      event.target.checked,
                    )
                  }
                  disabled={saving}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#D4AF37]"
                />

                <span className="text-sm leading-6 text-neutral-700">
                  Billing address is the
                  same as the delivery
                  address.
                </span>
              </label>

              {!billingSameAsShipping && (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      label="Billing Name"
                      id="billing-name"
                      value={
                        billingForm.name
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "name",
                          value,
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <Field
                    label="Billing Email"
                    id="billing-email"
                    type="email"
                    value={
                      billingForm.email
                    }
                    onChange={(value) =>
                      updateBillingField(
                        "email",
                        value,
                      )
                    }
                    autoComplete="email"
                    disabled={saving}
                  />

                  <Field
                    label="Billing Phone"
                    id="billing-phone"
                    type="tel"
                    value={
                      billingForm.phone
                    }
                    onChange={(value) =>
                      updateBillingField(
                        "phone",
                        value,
                      )
                    }
                    autoComplete="tel"
                    inputMode="tel"
                    disabled={saving}
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="Company Name (Optional)"
                      id="billing-company"
                      required={false}
                      value={
                        billingForm.companyName ??
                        ""
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "companyName",
                          value,
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="billing-address"
                      className="mb-2 block text-sm font-bold text-neutral-800"
                    >
                      Billing Address
                    </label>

                    <textarea
                      id="billing-address"
                      required
                      rows={4}
                      value={
                        billingForm.address
                      }
                      onChange={(
                        event,
                      ) =>
                        updateBillingField(
                          "address",
                          event.target.value,
                        )
                      }
                      disabled={saving}
                      className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                    />
                  </div>

                  <Field
                    label="Billing City"
                    id="billing-city"
                    value={
                      billingForm.city
                    }
                    onChange={(value) =>
                      updateBillingField(
                        "city",
                        value,
                      )
                    }
                    disabled={saving}
                  />

                  <Field
                    label="Billing State"
                    id="billing-state"
                    value={
                      billingForm.state
                    }
                    onChange={(value) =>
                      updateBillingField(
                        "state",
                        value,
                      )
                    }
                    disabled={saving}
                  />

                  <Field
                    label="Billing PIN Code"
                    id="billing-pincode"
                    value={
                      billingForm.pincode
                    }
                    onChange={(value) =>
                      updateBillingField(
                        "pincode",
                        value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    inputMode="numeric"
                    maxLength={6}
                    disabled={saving}
                  />

                  <Field
                    label="Country"
                    id="billing-country"
                    value={
                      billingForm.country
                    }
                    onChange={(value) =>
                      updateBillingField(
                        "country",
                        value,
                      )
                    }
                    disabled={saving}
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="GSTIN (Optional)"
                      id="billing-gstin"
                      required={false}
                      value={
                        billingForm.gstin ??
                        ""
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "gstin",
                          value.toUpperCase(),
                        )
                      }
                      placeholder="Optional GSTIN"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}
            </div>

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
                    Your order information
                    is securely submitted
                    to Nexletronics and
                    payment is processed
                    through Razorpay.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
            >
              {saving
                ? "Opening Secure Payment..."
                : "Proceed to Payment"}

              {!saving && (
                <CreditCard
                  size={18}
                />
              )}
            </button>
          </form>

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
                (item) => (
                  <div
                    key={
                      item.product.id
                    }
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-neutral-900">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Qty:{" "}
                        {item.quantity}
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
                  {totalItems}
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
                  Calculated securely at checkout
                </span>
              </div>
            </div>

            <div className="my-6 h-px bg-neutral-200" />

            <div className="flex items-end justify-between gap-4">
              <span className="text-sm font-bold text-neutral-500">
                Order Total
              </span>

              <span className="text-3xl font-black text-neutral-950">
                ₹
                {formatPrice(
                  cartTotal,
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
                  The final amount is
                  calculated from trusted
                  product prices on the
                  server before Razorpay
                  payment opens.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}