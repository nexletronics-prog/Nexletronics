import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileBox,
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  subscribePrintingOrders,
} from "../../services/printing.service";

import type {
  PrintingFinish,
  PrintingMaterial,
  PrintingOrder,
  PrintingOrderStatus,
} from "../../types/printing";


interface PrintingRazorpayCreateOrderResponse {
  success?: boolean;
  paymentType?: string;
  printingOrderId?: string;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

interface PrintingRazorpayVerifyResponse {
  success?: boolean;
  verified?: boolean;
  paymentType?: string;
  printingOrderId?: string;
  orderId?: string;
  paymentStatus?: string;
  error?: string;
}

interface PrintingRazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface PrintingRazorpayOptions {
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
    response: PrintingRazorpayPaymentResponse,
  ) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };
  retry?: {
    enabled: boolean;
  };
}

interface PrintingRazorpayInstance {
  open: () => void;
  on?: (
    event: string,
    callback: (response: unknown) => void,
  ) => void;
}

type PrintingRazorpayConstructor = new (
  options: PrintingRazorpayOptions,
) => PrintingRazorpayInstance;

function loadPrintingRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true },
      );
      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/*
 * ==========================================================
 * FIRESTORE COLLECTION
 * ==========================================================
 */

/*
 * ==========================================================
 * STATUS LABELS
 * ==========================================================
 */

const STATUS_LABELS:
  Record<
    PrintingOrderStatus,
    string
  > = {

  pending:
    "Pending Review",

  reviewing:
    "Under Review",

  quoted:
    "Quote Ready",

  payment_pending:
    "Payment Pending",

  paid:
    "Payment Received",

  approved:
    "Approved",

  printing:
    "Printing",

  quality_check:
    "Quality Check",

  ready:
    "Ready for Collection",

  completed:
    "Completed",

  rejected:
    "Rejected",

  cancelled:
    "Cancelled",
};


/*
 * ==========================================================
 * MAIN COMPONENT
 * ==========================================================
 */

export default function MyPrintingOrders() {

  const {
    user,
  } = useAuth();


  /*
   * ========================================================
   * STATE
   * ========================================================
   */

  const [
    orders,
    setOrders,
  ] =
    useState<PrintingOrder[]>(
      [],
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  /*
   * ========================================================
   * REALTIME ORDERS
   * ========================================================
   *
   * Orders are now loaded from Supabase through the shared
   * printing service. The subscription continues to reflect
   * admin changes without requiring a browser refresh.
   */

  const userId = user?.uid;

  useEffect(() => {
    let active = true;
    let receivedOrdersUpdate = false;

    // Defer the initial state reset and avoid overriding an immediate
    // subscription callback.
    queueMicrotask(() => {
      if (!active || receivedOrdersUpdate) return;

      if (!userId) {
        setOrders([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
    });

    if (!userId) {
      return () => {
        active = false;
      };
    }

    const unsubscribe = subscribePrintingOrders(
      userId,
      (nextOrders) => {
        receivedOrdersUpdate = true;
        if (!active) return;

        setOrders(nextOrders);
        setLoading(false);
        setError("");
      },
      (listenerError) => {
        receivedOrdersUpdate = true;
        if (!active) return;

        console.error("Unable to load printing orders:", listenerError);
        setError(listenerError.message || "Unable to load your printing requests.");
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);


  /*
   * ========================================================
   * NOT LOGGED IN
   * ========================================================
   */

  if (
    !user
  ) {

    return (
      <section className="section bg-[#faf9f5]">

        <div className="container-custom">

          <div className="mx-auto max-w-xl rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-sm">

            <FileBox
              size={36}
              className="mx-auto text-[#D4AF37]"
            />


            <h1 className="mt-5 text-3xl font-black text-neutral-950">
              Sign in to view your 3D printing
            </h1>


            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Sign in to view your printing requests,
              quotations, payments and production status.
            </p>


            <Link
              to="/login"
              className="mt-6 inline-flex rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622]"
            >
              Sign In
            </Link>

          </div>

        </div>

      </section>
    );
  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <section className="bg-white">

      {/* ==================================================
          HERO
      =================================================== */}

      <section className="border-b border-neutral-200 bg-[#faf9f5] py-16">

        <div className="container-custom">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Manufacturing Portal
          </p>


          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h1 className="text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
                My 3D Printing
              </h1>


              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
                Create new printing requests and track every
                STL order from quotation through production.
              </p>

            </div>


            <Link
              to="/3d-printing"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622]"
            >

              <Plus
                size={17}
              />

              New Print

              <ArrowRight
                size={16}
              />

            </Link>

          </div>

        </div>

      </section>


      {/* ==================================================
          MAIN
      =================================================== */}

      <section className="section">

        <div className="container-custom">

          {error && (

            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700"
            >

              {
                error
              }

            </div>

          )}


          {/* ==================================================
              NEW PRINT CARD
          =================================================== */}

          <Link
            to="/3d-printing"
            className="group mb-10 block overflow-hidden rounded-[2rem] border border-[#D4AF37]/25 bg-gradient-to-r from-[#faf9f5] via-white to-[#faf9f5] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:shadow-xl"
          >

            <div className="relative p-6 sm:p-8">

              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-[#D4AF37]/10 blur-3xl" />


              <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-5">

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/25 transition duration-300 group-hover:scale-105">

                    <Plus
                      size={30}
                    />

                  </div>


                  <div>

                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                      3D Printing
                    </p>


                    <h2 className="mt-1 text-2xl font-black text-neutral-950 sm:text-3xl">
                      New 3D Printing Request
                    </h2>


                    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                      Upload an STL, choose your material and
                      finish, review your estimate, and send the
                      request to Nexletronics.
                    </p>

                  </div>

                </div>


                <div className="flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#D4AF37]/10 px-5 py-3 text-sm font-black text-[#9b7e1d] transition group-hover:bg-[#D4AF37] group-hover:text-white md:self-auto">

                  Start New Print

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />

                </div>

              </div>


              {/* QUICK BENEFITS */}

              <div className="relative mt-7 grid gap-3 border-t border-neutral-200 pt-6 sm:grid-cols-3">

                <QuickBenefit
                  label="Upload STL"
                  value="50 MB maximum"
                />


                <QuickBenefit
                  label="Choose Material"
                  value="Admin-configured"
                />


                <QuickBenefit
                  label="Get Quote"
                  value="Reviewed by Nexletronics"
                />

              </div>

            </div>

          </Link>


          {/* ==================================================
              REQUEST HISTORY HEADER
          =================================================== */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
                Your Requests
              </p>


              <h2 className="mt-2 text-2xl font-black text-neutral-950">
                Printing Requests
              </h2>

            </div>


            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">

              <RefreshCw
                size={14}
              />

              Live updates enabled

            </div>

          </div>


          {/* ==================================================
              LOADING
          =================================================== */}

          {loading ? (

            <div className="flex min-h-[30vh] items-center justify-center rounded-[2rem] border border-neutral-200 bg-white">

              <div className="text-center">

                <Loader2
                  size={34}
                  className="mx-auto animate-spin text-[#D4AF37]"
                />


                <p className="mt-4 text-sm font-bold text-neutral-500">
                  Loading your printing requests...
                </p>

              </div>

            </div>

          ) : orders.length ===
            0 ? (

            /* =================================================
               EMPTY HISTORY
            ================================================== */

            <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-[#faf9f5] p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#D4AF37] shadow-sm">

                <FileBox
                  size={28}
                />

              </div>


              <h3 className="mt-5 text-2xl font-black text-neutral-950">
                No printing requests yet
              </h3>


              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Your submitted STL printing requests will appear
                here with live quotation, payment and production
                updates.
              </p>


              <Link
                to="/3d-printing"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622]"
              >

                <Plus
                  size={17}
                />

                Create Your First Print

              </Link>

            </div>

          ) : (

            /* =================================================
               HISTORY
            ================================================== */

            <div className="space-y-6">

              {orders.map(
                (
                  order,
                ) => (

                  <PrintingOrderCard
                    key={
                      order.id
                    }
                    order={
                      order
                    }
                  />

                ),
              )}

            </div>

          )}

        </div>

      </section>

    </section>
  );
}


/*
 * ==========================================================
 * QUICK BENEFIT
 * ==========================================================
 */

function QuickBenefit({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">

      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
        {
          label
        }
      </p>


      <p className="mt-1 text-sm font-black text-neutral-800">
        {
          value
        }
      </p>

    </div>
  );
}


/*
 * ==========================================================
 * ORDER CARD
 * ==========================================================
 */

function PrintingOrderCard({
  order,
}: {
  order: PrintingOrder;
}) {
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  async function handleAcceptAndPay(): Promise<void> {
    if (paying) return;

    if (!user) {
      setPayError("Please sign in before paying for your quote.");
      return;
    }

    setPaying(true);
    setPayError("");

    try {
      const scriptLoaded = await loadPrintingRazorpayScript();
      const RazorpayConstructor = window.Razorpay as unknown as
        | PrintingRazorpayConstructor
        | undefined;

      if (!scriptLoaded || !RazorpayConstructor) {
        throw new Error(
          "Unable to load Razorpay Checkout. Check your internet connection and try again.",
        );
      }

      const idToken = await user.getIdToken();
      const createResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          paymentType: "printing",
          printingOrderId: order.id,
        }),
      });

      const created = (await createResponse.json()) as
        PrintingRazorpayCreateOrderResponse;

      if (
        !createResponse.ok ||
        created.success !== true ||
        created.paymentType !== "printing" ||
        created.printingOrderId !== order.id ||
        typeof created.orderId !== "string" ||
        !created.orderId ||
        typeof created.keyId !== "string" ||
        !created.keyId ||
        !Number.isSafeInteger(created.amount) ||
        typeof created.currency !== "string" ||
        !created.currency
      ) {
        throw new Error(
          created.error || "Unable to initialize payment for this printing quote.",
        );
      }

      const checkout = new RazorpayConstructor({
        key: created.keyId,
        amount: created.amount as number,
        currency: created.currency,
        name: "Nexletronics",
        description: `3D printing quote #${order.id.slice(0, 8)}`,
        order_id: created.orderId,
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
        },
        notes: {
          source: "nexletronics-printing-quote",
          printingOrderId: order.id,
        },
        theme: {
          color: "#D4AF37",
        },
        retry: {
          enabled: true,
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setPaying(false);
          },
        },
        handler: async (paymentResponse) => {
          try {
            setPayError("");
            const verificationToken = await user.getIdToken();
            const verifyResponse = await fetch(
              "/api/razorpay/verify-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${verificationToken}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }),
              },
            );

            const verified = (await verifyResponse.json()) as
              PrintingRazorpayVerifyResponse;

            if (
              !verifyResponse.ok ||
              verified.success !== true ||
              verified.verified !== true ||
              verified.paymentType !== "printing" ||
              verified.printingOrderId !== order.id ||
              verified.paymentStatus !== "paid"
            ) {
              throw new Error(
                verified.error ||
                  "Payment could not be verified against this printing quote.",
              );
            }

            // The server has confirmed capture and updated printing_orders.
            // Reload to fetch the authoritative status even if Realtime is delayed.
            window.location.reload();
          } catch (verificationError) {
            console.error(
              "[MyPrintingOrders] Razorpay verification failed:",
              verificationError,
            );
            setPayError(
              verificationError instanceof Error
                ? `${verificationError.message} If money was deducted, do not pay again until the order status is checked.`
                : "Payment verification could not be completed. If money was deducted, do not pay again until the order status is checked.",
            );
            setPaying(false);
          }
        },
      });

      checkout.on?.("payment.failed", (failure) => {
        const details = failure as {
          error?: { description?: string };
        };
        setPayError(
          details.error?.description ||
            "Payment failed. Your printing request has not been confirmed as paid.",
        );
        setPaying(false);
      });

      checkout.open();
    } catch (paymentError) {
      console.error(
        "[MyPrintingOrders] Could not start quote payment:",
        paymentError,
      );
      setPayError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to start payment. Please try again.",
      );
      setPaying(false);
    }
  }

  const hasFinalPrice =
    typeof order.finalPrice ===
    "number" &&
    order.finalPrice >
      0;


  const isPaid =
    order.paymentStatus ===
    "paid";


  const canPay =
    hasFinalPrice &&
    !isPaid &&
    [
      "quoted",
      "payment_pending",
    ].includes(
      order.status,
    );


  return (
    <article className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">

      {/* ==================================================
          CARD HEADER
      =================================================== */}

      <div className="border-b border-neutral-200 bg-[#faf9f5] px-6 py-5 sm:px-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-center gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <FileBox
                size={20}
              />

            </div>


            <div className="min-w-0">

              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                Print Request
              </p>


              <h3 className="mt-1 truncate text-lg font-black text-neutral-950">
                {
                  order.originalFileName
                }
              </h3>


              <p className="mt-1 text-xs text-neutral-400">

                Request #
                {
                  order.id.slice(
                    0,
                    8,
                  )
                }

              </p>

            </div>

          </div>


          <StatusBadge
            status={
              order.status
            }
          />

        </div>

      </div>


      {/* ==================================================
          CARD BODY
      =================================================== */}

      <div className="p-6 sm:p-8">

        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">

          {/* =================================================
              DETAILS
          ================================================== */}

          <div>

            <div className="grid gap-5 sm:grid-cols-2">

              <Detail
                label="Material"
                value={
                  formatMaterial(
                    order.material,
                  )
                }
              />


              <Detail
                label="Finish"
                value={
                  formatFinish(
                    order.finish,
                  )
                }
              />


              <Detail
                label="Quantity"
                value={
                  String(
                    order.quantity,
                  )
                }
              />


              <Detail
                label="Payment"
                value={
                  formatPaymentStatus(
                    order.paymentStatus,
                  )
                }
              />

            </div>


            {/* MODEL */}

            <div className="mt-6 rounded-2xl border border-neutral-200 p-5">

              <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                Model
              </p>


              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">

                <Detail
                  label="Width"
                  value={`${safeNumber(
                    order.dimensions.width,
                  ).toFixed(
                    1,
                  )} mm`}
                />


                <Detail
                  label="Depth"
                  value={`${safeNumber(
                    order.dimensions.depth,
                  ).toFixed(
                    1,
                  )} mm`}
                />


                <Detail
                  label="Height"
                  value={`${safeNumber(
                    order.dimensions.height,
                  ).toFixed(
                    1,
                  )} mm`}
                />


                <Detail
                  label="Volume"
                  value={
                    typeof order.volumeCm3 ===
                    "number"
                      ? `${order.volumeCm3.toFixed(
                          2,
                        )} cm³`
                      : "—"
                  }
                />

              </div>

            </div>


            {/* CUSTOMER NOTES */}

            {order.customerNotes?.trim() && (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                  Your Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700">
                  {order.customerNotes}
                </p>
              </div>
            )}


            {/* ADMIN NOTES */}

            {order.adminNotes?.trim() && (

              <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">

                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9b7e1d]">
                  Note from Nexletronics
                </p>


                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {
                    order.adminNotes
                  }
                </p>

              </div>

            )}

          </div>


          {/* =================================================
              PRICING
          ================================================== */}

          <div>

            <div className="rounded-3xl border border-neutral-200 bg-[#faf9f5] p-6">

              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                Quote
              </p>


              {/* ESTIMATE */}

              <div className="mt-5 flex items-center justify-between gap-4">

                <div>

                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Initial estimate
                  </p>


                  <p className="mt-1 text-xl font-black text-neutral-600">

                    ₹
                    {
                      formatMoney(
                        order.estimatedPrice,
                      )
                    }

                  </p>

                </div>

              </div>


              {/* FINAL PRICE */}

              {hasFinalPrice ? (

                <div className="mt-6 rounded-2xl border border-[#D4AF37]/30 bg-white p-5">

                  <p className="text-xs font-black uppercase tracking-wider text-[#9b7e1d]">
                    Final price
                  </p>


                  <p className="mt-2 text-4xl font-black text-neutral-950">

                    ₹
                    {
                      formatMoney(
                        order.finalPrice ?? 0,
                      )
                    }

                  </p>


                  {payError && (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 font-medium text-red-700"
                    >
                      {payError}
                    </p>
                  )}

                  {canPay && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleAcceptAndPay();
                      }}
                      disabled={paying}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {paying ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Accept & Pay
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  )}


                  {isPaid && (

                    <div className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">

                      <CheckCircle2
                        size={17}
                      />

                      Payment received

                    </div>

                  )}

                </div>

              ) : (

                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-5">

                  <p className="text-sm font-black text-neutral-700">
                    Waiting for final quote
                  </p>


                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    Nexletronics will review your STL and
                    provide the final payable amount.
                  </p>

                </div>

              )}


              {/* ESTIMATE DETAILS */}

              <div className="mt-5 grid grid-cols-2 gap-3">

                <SmallInfo
                  label="Weight"
                  value={
                    typeof order.estimatedWeightGrams ===
                    "number"
                      ? `${order.estimatedWeightGrams.toFixed(
                          1,
                        )} g`
                      : "—"
                  }
                />


                <SmallInfo
                  label="Print Time"
                  value={
                    typeof order.estimatedPrintTimeMinutes ===
                    "number"
                      ? formatDuration(
                          order.estimatedPrintTimeMinutes,
                        )
                      : "—"
                  }
                />

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            STATUS TIMELINE
        =================================================== */}

        <div className="mt-8 border-t border-neutral-200 pt-7">

          <div className="flex items-center justify-between">

            <p className="text-xs font-black uppercase tracking-[0.15em] text-neutral-400">
              Production Status
            </p>


            <span className="text-xs font-bold text-neutral-400">
              Live
            </span>

          </div>


          <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">

            <ProgressItem
              label="Request"
              active={
                true
              }
              complete={
                [
                  "reviewing",
                  "quoted",
                  "payment_pending",
                  "paid",
                  "approved",
                  "printing",
                  "quality_check",
                  "ready",
                  "completed",
                ].includes(
                  order.status,
                )
              }
            />


            <ProgressItem
              label="Review"
              active={[
                "reviewing",
                "quoted",
                "payment_pending",
                "paid",
                "approved",
                "printing",
                "quality_check",
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
              complete={[
                "quoted",
                "payment_pending",
                "paid",
                "approved",
                "printing",
                "quality_check",
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
            />


            <ProgressItem
              label="Quote"
              active={[
                "quoted",
                "payment_pending",
                "paid",
                "approved",
                "printing",
                "quality_check",
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
              complete={[
                "payment_pending",
                "paid",
                "approved",
                "printing",
                "quality_check",
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
            />


            <ProgressItem
              label="Payment"
              active={[
                "payment_pending",
                "paid",
                "approved",
                "printing",
                "quality_check",
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
              complete={
                order.paymentStatus ===
                "paid"
              }
            />


            <ProgressItem
              label="Printing"
              active={[
                "printing",
                "quality_check",
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
              complete={[
                "quality_check",
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
            />


            <ProgressItem
              label="Complete"
              active={[
                "ready",
                "completed",
              ].includes(
                order.status,
              )}
              complete={
                order.status ===
                "completed"
              }
            />

          </div>

        </div>

      </div>

    </article>
  );
}


/*
 * ==========================================================
 * STATUS BADGE
 * ==========================================================
 */

function StatusBadge({
  status,
}: {
  status: PrintingOrderStatus;
}) {

  const positive =
    [
      "quoted",
      "payment_pending",
      "paid",
      "approved",
      "printing",
      "quality_check",
      "ready",
      "completed",
    ].includes(
      status,
    );


  const negative =
    [
      "rejected",
      "cancelled",
    ].includes(
      status,
    );


  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-4 py-2 text-xs font-black",

        positive
          ? "bg-green-50 text-green-700"
          : negative
            ? "bg-red-50 text-red-700"
            : "bg-neutral-100 text-neutral-600",

      ].join(
        " ",
      )}
    >

      {positive ? (

        <CheckCircle2
          size={14}
          className="mr-2"
        />

      ) : negative ? (

        <XCircle
          size={14}
          className="mr-2"
        />

      ) : (

        <Clock3
          size={14}
          className="mr-2"
        />

      )}


      {
        STATUS_LABELS[
          status
        ]
      }

    </span>
  );
}


/*
 * ==========================================================
 * DETAIL
 * ==========================================================
 */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div>

      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
        {
          label
        }
      </p>


      <p className="mt-1 text-sm font-black text-neutral-950">
        {
          value
        }
      </p>

    </div>
  );
}


/*
 * ==========================================================
 * SMALL INFO
 * ==========================================================
 */

function SmallInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">

      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
        {
          label
        }
      </p>


      <p className="mt-1 text-sm font-black text-neutral-950">
        {
          value
        }
      </p>

    </div>
  );
}


/*
 * ==========================================================
 * PROGRESS ITEM
 * ==========================================================
 */

function ProgressItem({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {

  return (
    <div
      className={[
        "rounded-2xl border px-3 py-3 transition",

        active
          ? "border-[#D4AF37]/40 bg-[#D4AF37]/5"
          : "border-neutral-200 bg-neutral-50",

      ].join(
        " ",
      )}
    >

      <div className="flex items-center gap-2">

        <div
          className={[
            "flex h-7 w-7 items-center justify-center rounded-full",

            complete
              ? "bg-green-100 text-green-600"
              : active
                ? "bg-[#D4AF37]/20 text-[#9b7e1d]"
                : "bg-neutral-200 text-neutral-400",

          ].join(
            " ",
          )}
        >

          {complete ? (

            <CheckCircle2
              size={14}
            />

          ) : (

            <span className="h-2 w-2 rounded-full bg-current" />

          )}

        </div>


        <span
          className={[
            "text-xs font-black",

            active
              ? "text-neutral-900"
              : "text-neutral-400",

          ].join(
            " ",
          )}
        >

          {
            label
          }

        </span>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * MATERIAL FORMATTER
 * ==========================================================
 */

function formatMaterial(
  material: PrintingMaterial,
): string {

  if (
    !material
  ) {

    return "Unknown";
  }


  return material
    .replace(
      /[-_]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}


/*
 * ==========================================================
 * FINISH FORMATTER
 * ==========================================================
 */

function formatFinish(
  finish: PrintingFinish,
): string {

  return finish ===
    "premium"
    ? "Premium"
    : "Rough";
}


/*
 * ==========================================================
 * PAYMENT FORMATTER
 * ==========================================================
 */

function formatPaymentStatus(
  status:
    PrintingOrder["paymentStatus"],
): string {

  switch (
    status
  ) {

    case "paid":
      return "Paid";

    case "pending":
      return "Payment Pending";

    case "failed":
      return "Payment Failed";

    case "refunded":
      return "Refunded";

    case "unpaid":
    default:
      return "Unpaid";
  }
}


/*
 * ==========================================================
 * MONEY FORMATTER
 * ==========================================================
 */

function formatMoney(
  value: number,
): string {

  const numeric =
    Number(
      value,
    );


  return Math.ceil(
    Number.isFinite(
      numeric,
    )
      ? numeric
      : 0,
  ).toLocaleString(
    "en-IN",
  );
}


/*
 * ==========================================================
 * DURATION FORMATTER
 * ==========================================================
 */

function formatDuration(
  minutes: number,
): string {

  const safeMinutes =
    Math.max(
      0,
      Math.round(
        Number(
          minutes,
        ),
      ),
    );


  const hours =
    Math.floor(
      safeMinutes /
        60,
    );


  const remaining =
    safeMinutes %
    60;


  if (
    hours ===
    0
  ) {

    return `${remaining} min`;
  }


  if (
    remaining ===
    0
  ) {

    return `${hours} h`;
  }


  return `${hours} h ${remaining} min`;
}


/*
 * ==========================================================
 * SAFE NUMBER
 * ==========================================================
 */

function safeNumber(
  value: unknown,
): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
