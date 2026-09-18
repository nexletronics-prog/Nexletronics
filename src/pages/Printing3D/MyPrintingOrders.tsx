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
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";

import {
  Link,
} from "react-router-dom";

import {
  db,
} from "../../firebase/config";

import {
  useAuth,
} from "../../hooks/useAuth";

import type {
  PrintingFinish,
  PrintingMaterial,
  PrintingOrder,
  PrintingOrderStatus,
} from "../../types/printing";


/*
 * ==========================================================
 * FIRESTORE COLLECTION
 * ==========================================================
 */

const ORDERS_COLLECTION =
  "threeDPrintOrders";


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
   * Every admin change to the customer's printing request
   * is reflected automatically.
   */

  useEffect(() => {

    if (
      !user
    ) {

      setOrders(
        [],
      );

      setLoading(
        false,
      );

      return;
    }


    setLoading(
      true,
    );

    setError(
      "",
    );


    const ordersQuery =
      query(
        collection(
          db,
          ORDERS_COLLECTION,
        ),
        where(
          "userId",
          "==",
          user.uid,
        ),
      );


    const unsubscribe =
      onSnapshot(
        ordersQuery,

        (
          snapshot,
        ) => {

          const nextOrders =
            snapshot.docs.map(
              (
                document,
              ) =>
                mapPrintingOrder(
                  document.id,
                  document.data(),
                ),
            );


          /*
           * Newest requests first.
           */

          nextOrders.sort(
            (
              first,
              second,
            ) =>
              getTimestampMilliseconds(
                second.createdAt,
              ) -
              getTimestampMilliseconds(
                first.createdAt,
              ),
          );


          setOrders(
            nextOrders,
          );


          setLoading(
            false,
          );
        },

        (
          snapshotError,
        ) => {

          console.error(
            "Unable to load printing orders:",
            snapshotError,
          );


          setError(
            getFirestoreErrorMessage(
              snapshotError,
            ),
          );


          setLoading(
            false,
          );
        },
      );


    return () => {

      unsubscribe();

    };

  }, [
    user,
  ]);


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


                  {canPay && (

                    <button
                      type="button"
                      onClick={() =>
                        window.alert(
                          "The payment gateway will be connected to this button next.",
                        )
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622]"
                    >

                      Accept & Pay

                      <ArrowRight
                        size={16}
                      />

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
 * TIMESTAMP
 * ==========================================================
 */

function getTimestampMilliseconds(
  value: unknown,
): number {

  if (
    value &&
    typeof value ===
      "object"
  ) {

    const timestamp =
      value as {
        seconds?: unknown;
      };


    if (
      typeof timestamp.seconds ===
      "number"
    ) {

      return (
        timestamp.seconds *
        1000
      );
    }
  }


  if (
    value instanceof
    Date
  ) {

    return value.getTime();
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
 * FIRESTORE DOCUMENT MAPPER
 * ==========================================================
 */

function mapPrintingOrder(
  id: string,
  data: DocumentData,
): PrintingOrder {

  const status =
    isPrintingOrderStatus(
      data.status,
    )
      ? data.status
      : "pending";


  const paymentStatus =
    isPaymentStatus(
      data.paymentStatus,
    )
      ? data.paymentStatus
      : "unpaid";


  const dimensions =
    data.dimensions &&
    typeof data.dimensions ===
      "object"
      ? data.dimensions
      : {};


  return {

    id,

    userId:
      typeof data.userId ===
        "string"
        ? data.userId
        : "",

    customerName:
      typeof data.customerName ===
        "string"
        ? data.customerName
        : "Customer",

    customerEmail:
      typeof data.customerEmail ===
        "string"
        ? data.customerEmail
        : "",

    originalFileName:
      typeof data.originalFileName ===
        "string"
        ? data.originalFileName
        : "model.stl",

    storagePath:
      typeof data.storagePath ===
        "string"
        ? data.storagePath
        : "",

    material:
      typeof data.material ===
        "string"
        ? data.material
        : "unknown",

    finish:
      data.finish ===
        "premium"
        ? "premium"
        : "rough",

    quantity:
      typeof data.quantity ===
        "number"
        ? data.quantity
        : 1,

    dimensions: {

      width:
        safeNumber(
          dimensions.width,
        ),

      depth:
        safeNumber(
          dimensions.depth,
        ),

      height:
        safeNumber(
          dimensions.height,
        ),
    },

    volumeCm3:
      typeof data.volumeCm3 ===
        "number"
        ? data.volumeCm3
        : undefined,

    estimatedWeightGrams:
      typeof data.estimatedWeightGrams ===
        "number"
        ? data.estimatedWeightGrams
        : undefined,

    estimatedPrintTimeMinutes:
      typeof data.estimatedPrintTimeMinutes ===
        "number"
        ? data.estimatedPrintTimeMinutes
        : undefined,

    estimate:
      data.estimate,

    estimatedPrice:
      typeof data.estimatedPrice ===
        "number"
        ? data.estimatedPrice
        : 0,

    finalPrice:
      typeof data.finalPrice ===
        "number"
        ? data.finalPrice
        : undefined,

    status,

    paymentStatus,

    adminNotes:
      typeof data.adminNotes ===
        "string"
        ? data.adminNotes
        : "",

    customerNotes:
      typeof data.customerNotes ===
        "string"
        ? data.customerNotes
        : "",

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}


/*
 * ==========================================================
 * STATUS GUARD
 * ==========================================================
 */

function isPrintingOrderStatus(
  value: unknown,
): value is PrintingOrderStatus {

  return [
    "pending",
    "reviewing",
    "quoted",
    "payment_pending",
    "paid",
    "approved",
    "printing",
    "quality_check",
    "ready",
    "completed",
    "rejected",
    "cancelled",
  ].includes(
    String(
      value,
    ),
  );
}


/*
 * ==========================================================
 * PAYMENT GUARD
 * ==========================================================
 */

function isPaymentStatus(
  value: unknown,
): value is PrintingOrder["paymentStatus"] {

  return [
    "unpaid",
    "pending",
    "paid",
    "failed",
    "refunded",
  ].includes(
    String(
      value,
    ),
  );
}


/*
 * ==========================================================
 * SAFE NUMBER
 * ==========================================================
 */

function safeNumber(
  value: unknown,
): number {

  const numeric =
    Number(
      value,
    );


  return Number.isFinite(
    numeric,
  )
    ? numeric
    : 0;
}


/*
 * ==========================================================
 * FIRESTORE ERROR
 * ==========================================================
 */

function getFirestoreErrorMessage(
  error: unknown,
): string {

  if (
    error &&
    typeof error ===
      "object" &&
    "code" in error
  ) {

    const code =
      String(
        (
          error as {
            code?: unknown;
          }
        ).code ??
          "",
      );


    switch (
      code
    ) {

      case "permission-denied":

        return "You do not have permission to view your printing requests.";

      case "unavailable":

        return "The printing service is temporarily unavailable.";

      case "failed-precondition":

        return "The printing request database needs additional configuration.";

      default:
        break;
    }
  }


  if (
    error instanceof
      Error &&
    error.message.trim()
  ) {

    return error.message;
  }


  return "Unable to load your printing requests.";
}