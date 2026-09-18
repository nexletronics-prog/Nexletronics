import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  getCustomQuotation,
} from "../../services/customQuotation.service";

import type {
  CustomQuotation,
} from "../../types/customProject";


/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function safeString(
  value:
    unknown,

  fallback =
    "",
): string {

  return typeof value ===
    "string"
    ? value
    : fallback;
}


function safeNumber(
  value:
    unknown,
): number {

  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  ) {

    return value;
  }


  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


/*
 * ==========================================================
 * PAYMENT PAGE
 * ==========================================================
 */

export default function CustomProjectPayment() {

  const {
    projectId,
    quotationId,
  } =
    useParams<{
      projectId:
        string;

      quotationId:
        string;
    }>();


  const navigate =
    useNavigate();


  const {
    user,
    loading:
      authLoading,
  } =
    useAuth();


  /*
   * ========================================================
   * QUOTATION
   * ========================================================
   */

  const [
    quotation,
    setQuotation,
  ] =
    useState<
      CustomQuotation |
      null
    >(null);


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
   * LOAD QUOTATION
   * ========================================================
   */

  useEffect(
    () => {

      let active =
        true;


      async function loadQuotation() {

        if (
          !projectId ||
          !quotationId
        ) {

          if (
            active
          ) {

            setError(
              "Payment information is missing.",
            );


            setLoading(
              false,
            );

          }


          return;
        }


        try {

          setLoading(
            true,
          );


          setError(
            "",
          );


          const result =
            await getCustomQuotation(
              projectId,
              quotationId,
            );


          if (
            !active
          ) {

            return;
          }


          if (
            !result
          ) {

            setQuotation(
              null,
            );


            setError(
              "Quotation not found.",
            );


            setLoading(
              false,
            );


            return;
          }


          setQuotation(
            result,
          );


          setLoading(
            false,
          );

        } catch (
          loadError
        ) {

          console.error(
            "Payment quotation loading failed:",
            loadError,
          );


          if (
            !active
          ) {

            return;
          }


          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load quotation.",
          );


          setLoading(
            false,
          );
        }
      }


      void loadQuotation();


      return () => {

        active =
          false;

      };

    },
    [
      projectId,
      quotationId,
    ],
  );


  /*
   * ========================================================
   * AUTH LOADING
   * ========================================================
   */

  if (
    authLoading
  ) {

    return (
      <LoadingState />
    );
  }


  /*
   * ========================================================
   * LOGIN
   * ========================================================
   */

  if (
    !user
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-20">

          <div className="w-full rounded-[2rem] border border-neutral-200 bg-white p-10 text-center shadow-sm">

            <ShieldCheck
              size={44}
              className="mx-auto text-[#D4AF37]"
            />


            <h1 className="mt-5 text-3xl font-black text-neutral-950">
              Sign in to continue
            </h1>


            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              Your custom-project payment is connected to your
              Nexletronics account.
            </p>


            <button
              type="button"

              onClick={() =>
                navigate(
                  "/login",
                  {
                    state: {
                      from:
                        projectId &&
                        quotationId
                          ? `/custom-solutions/projects/${projectId}/payment/${quotationId}`
                          : "/custom-solutions",
                    },
                  },
                )
              }

              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white hover:bg-[#b99622]"
            >

              Login to Continue

            </button>

          </div>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * PAGE LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (
      <LoadingState />
    );
  }


  /*
   * ========================================================
   * NOT FOUND
   * ========================================================
   */

  if (
    !quotation
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-20">

          <div className="w-full rounded-[2rem] border border-neutral-200 bg-white p-10 text-center shadow-sm">

            <FileText
              size={44}
              className="mx-auto text-[#D4AF37]"
            />


            <h1 className="mt-5 text-3xl font-black text-neutral-950">
              Quotation not found
            </h1>


            <p className="mt-3 text-sm text-neutral-500">

              {
                error ||
                "The quotation required for payment could not be found."
              }

            </p>


            <Link
              to={
                projectId
                  ? `/custom-solutions/projects/${projectId}`
                  : "/custom-solutions"
              }

              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-white"
            >

              <ArrowLeft
                size={15}
              />

              Back to Project

            </Link>

          </div>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * VALUES
   * ========================================================
   */

  const currency =
    safeString(
      quotation.currency,
      "INR",
    );


  const total =
    safeNumber(
      quotation.total,
    );


  const projectTitle =
    safeString(
      quotation.projectTitle,
      "Custom Project",
    );


  const quotationNumber =
    safeString(
      quotation.quotationNumber,
      "Quotation",
    );


  const paymentRequired =
    Boolean(
      quotation.paymentRequired,
    );


  const paymentStatus =
    safeString(
      quotation.paymentStatus,
      "not_required",
    );


  const accepted =
    quotation.status ===
    "accepted";


  const paid =
    paymentStatus ===
    "paid";


  /*
   * ========================================================
   * PAYMENT INSTRUCTIONS
   * ========================================================
   */

  const paymentInstructions = [
    "Open the project conversation with Nexletronics.",
    "Request the current payment details or payment method.",
    "Complete the payment using the details provided by Nexletronics.",
    "Send the payment reference or transaction confirmation in the project conversation.",
    "Nexletronics will verify the payment and update the project.",
  ];


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (

    <main className="min-h-screen bg-[#faf9f5]">

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:px-10 lg:py-14">

        {/* ==================================================
            BACK
        =================================================== */}

        <Link
          to={
            projectId
              ? `/custom-solutions/projects/${projectId}`
              : "/custom-solutions"
          }

          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#D4AF37]"
        >

          <ArrowLeft
            size={16}
          />

          Back to Project

        </Link>


        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="mt-8">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Payment
          </p>


          <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950">
            Complete your project payment
          </h1>


          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
            Your quotation has been accepted. Follow the payment
            instructions provided by Nexletronics.
          </p>

        </div>


        {/* ==================================================
            ERROR
        =================================================== */}

        {error && (

          <div
            role="alert"

            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700"
          >

            {
              error
            }

          </div>

        )}


        {/* ==================================================
            PAID
        =================================================== */}

        {paid && (

          <section className="mt-7 rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-8">

            <div className="flex items-start gap-4">

              <CheckCircle2
                size={27}
                className="mt-0.5 shrink-0 text-green-600"
              />


              <div>

                <h2 className="text-xl font-black text-green-900">
                  Payment completed
                </h2>


                <p className="mt-2 text-sm leading-6 text-green-800">
                  Nexletronics has recorded this quotation as
                  paid. Your project can proceed to the next stage.
                </p>

              </div>

            </div>

          </section>

        )}


        {/* ==================================================
            PAYMENT CARD
        =================================================== */}

        <section className="mt-7 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="border-b border-neutral-100 bg-neutral-950 px-6 py-6 sm:px-8">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-white">

                <CreditCard
                  size={22}
                />

              </div>


              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                  Payment Request
                </p>


                <h2 className="mt-1 text-xl font-black text-white">
                  {
                    projectTitle
                  }
                </h2>


                <p className="mt-1 text-xs text-neutral-400">
                  {
                    quotationNumber
                  }
                </p>

              </div>

            </div>

          </div>


          <div className="p-6 sm:p-8">

            {/* AMOUNT */}

            <div className="rounded-3xl bg-[#faf9f5] p-6 text-center">

              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                Amount Payable
              </p>


              <p className="mt-3 text-4xl font-black text-neutral-950 sm:text-5xl">

                {
                  currency
                }

                {" "}

                {
                  total.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits:
                        2,

                      maximumFractionDigits:
                        2,
                    },
                  )
                }

              </p>

            </div>


            {/* STATUS */}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">

              <PaymentStatusCard
                icon={
                  FileText
                }

                title="Quotation"

                text={
                  quotation.status ===
                    "accepted"
                    ? "Accepted"
                    : "Not accepted"
                }
              />


              <PaymentStatusCard
                icon={
                  Clock3
                }

                title="Payment"

                text={
                  paid
                    ? "Paid"
                    : paymentRequired
                      ? "Pending"
                      : "Not required"
                }
              />


              <PaymentStatusCard
                icon={
                  ShieldCheck
                }

                title="Verification"

                text={
                  paid
                    ? "Completed"
                    : "Manual verification"
                }
              />

            </div>


            {/* =================================================
                NOT ACCEPTED
            ================================================== */}

            {!accepted &&
              !paid && (

              <div className="mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-5">

                <p className="font-black text-orange-900">
                  Quotation acceptance required
                </p>


                <p className="mt-1 text-sm leading-6 text-orange-800">
                  Please accept the quotation before making
                  the project payment.
                </p>


                <Link
                  to={
                    projectId &&
                    quotationId
                      ? `/custom-solutions/projects/${projectId}/quotation/${quotationId}`
                      : "/custom-solutions"
                  }

                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-white"
                >

                  Review Quotation

                  <ArrowRightIcon />

                </Link>

              </div>

            )}


            {/* =================================================
                NO PAYMENT REQUIRED
            ================================================== */}

            {accepted &&
              !paymentRequired &&
              !paid && (

              <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-5">

                <div className="flex items-start gap-3">

                  <CheckCircle2
                    size={20}
                    className="mt-0.5 text-green-600"
                  />


                  <div>

                    <p className="font-black text-green-900">
                      No payment is required
                    </p>


                    <p className="mt-1 text-sm leading-6 text-green-800">
                      Nexletronics can continue with your project.
                    </p>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                MANUAL PAYMENT
            ================================================== */}

            {accepted &&
              paymentRequired &&
              !paid && (

              <div className="mt-7 rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-6 sm:p-7">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-white">

                    <CreditCard
                      size={20}
                    />

                  </div>


                  <div>

                    <h3 className="text-xl font-black text-neutral-950">
                      Manual payment
                    </h3>


                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      No payment gateway is connected yet.
                      Contact Nexletronics through your project
                      conversation to receive the current payment
                      details.
                    </p>

                  </div>

                </div>


                {/* STEPS */}

                <div className="mt-7">

                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                    How to complete payment
                  </p>


                  <div className="mt-4 space-y-3">

                    {
                      paymentInstructions.map(
                        (
                          instruction,
                          index,
                        ) => (

                          <div
                            key={
                              instruction
                            }

                            className="flex items-start gap-3"
                          >

                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#9b7e1d] shadow-sm">

                              {
                                index + 1
                              }

                            </span>


                            <p className="pt-1 text-sm leading-6 text-neutral-700">

                              {
                                instruction
                              }

                            </p>

                          </div>

                        ),
                      )
                    }

                  </div>

                </div>


                {/* PROJECT CONVERSATION */}

                <Link
                  to={
                    projectId
                      ? `/custom-solutions/projects/${projectId}`
                      : "/custom-solutions"
                  }

                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white hover:bg-[#b99622]"
                >

                  <MessageCircle
                    size={17}
                  />

                  Open Project Conversation

                </Link>

              </div>

            )}


            {/* =================================================
                PAID ACTION
            ================================================== */}

            {paid && (

              <div className="mt-7 rounded-3xl border border-green-200 bg-green-50 p-6">

                <div className="flex items-start gap-4">

                  <CheckCircle2
                    size={23}
                    className="mt-0.5 shrink-0 text-green-600"
                  />


                  <div>

                    <p className="font-black text-green-900">
                      Payment recorded
                    </p>


                    <p className="mt-1 text-sm leading-6 text-green-800">
                      Your project is ready to proceed.
                    </p>


                    <Link
                      to={
                        projectId
                          ? `/custom-solutions/projects/${projectId}`
                          : "/custom-solutions"
                      }

                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-neutral-800"
                    >

                      Return to Project

                    </Link>

                  </div>

                </div>

              </div>

            )}

          </div>

        </section>


        {/* ==================================================
            SECURITY
        =================================================== */}

        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">

          <div className="flex items-start gap-3">

            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#D4AF37]"
            />


            <p className="text-xs leading-5 text-neutral-500">

              The amount shown here comes from the quotation
              stored in Firestore. Do not send payment to
              unverified payment details. Confirm payment
              instructions with Nexletronics through your
              project conversation.

            </p>

          </div>

        </section>

      </div>

    </main>
  );
}


/*
 * ==========================================================
 * PAYMENT STATUS CARD
 * ==========================================================
 */

function PaymentStatusCard({
  icon:
    Icon,

  title,

  text,
}: {
  icon:
    typeof CheckCircle2;

  title:
    string;

  text:
    string;
}) {

  return (

    <div className="rounded-2xl border border-neutral-200 p-4">

      <Icon
        size={18}
        className="text-[#D4AF37]"
      />


      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-neutral-400">

        {
          title
        }

      </p>


      <p className="mt-1 text-sm font-black text-neutral-900">

        {
          text
        }

      </p>

    </div>
  );
}


/*
 * ==========================================================
 * ARROW RIGHT
 * ==========================================================
 */

function ArrowRightIcon() {

  return (

    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >

      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
      />

      <polyline
        points="12 5 19 12 12 19"
      />

    </svg>
  );
}


/*
 * ==========================================================
 * LOADING STATE
 * ==========================================================
 */

function LoadingState() {

  return (

    <main className="min-h-screen bg-[#faf9f5]">

      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8">

        <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />


        <div className="mt-6 h-12 w-96 max-w-full animate-pulse rounded bg-neutral-200" />


        <div className="mt-8 h-[520px] animate-pulse rounded-3xl bg-neutral-100" />

      </div>

    </main>
  );
}