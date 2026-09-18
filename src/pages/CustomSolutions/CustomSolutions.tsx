import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Cpu,
  ExternalLink,
  FileText,
  Globe2,
  MessageCircle,
  MonitorSmartphone,
  Sparkles,
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
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "../../firebase/config";

import {
  useAuth,
} from "../../hooks/useAuth";

import type {
  CustomPortfolioCategory,
  CustomPortfolioItem,
  CustomProject,
} from "../../types/customProject";


/*
 * ==========================================================
 * PORTFOLIO NORMALIZER
 * ==========================================================
 */

function normalizePortfolio(
  id:
    string,

  data:
    Record<
      string,
      unknown
    >,
): CustomPortfolioItem {

  const category:
    CustomPortfolioCategory =
    data.category ===
      "devices"
      ? "devices"
      : "website";


  return {

    id,

    title:
      typeof data.title ===
      "string"
        ? data.title
        : "Untitled project",

    slug:
      typeof data.slug ===
      "string"
        ? data.slug
        : id,

    category,

    shortDescription:
      typeof data.shortDescription ===
      "string"
        ? data.shortDescription
        : "",

    description:
      typeof data.description ===
      "string"
        ? data.description
        : "",

    coverImage:
      typeof data.coverImage ===
      "string"
        ? data.coverImage
        : "",

    gallery:
      Array.isArray(
        data.gallery,
      )
        ? data.gallery.filter(
            (
              image,
            ): image is string =>
              typeof image ===
              "string" &&
              image.trim().length >
              0,
          )
        : [],

    technologies:
      Array.isArray(
        data.technologies,
      )
        ? data.technologies.filter(
            (
              technology,
            ): technology is string =>
              typeof technology ===
              "string" &&
              technology.trim().length >
              0,
          )
        : [],

    clientIndustry:
      typeof data.clientIndustry ===
      "string"
        ? data.clientIndustry
        : undefined,

    liveUrl:
      typeof data.liveUrl ===
      "string"
        ? data.liveUrl
        : undefined,

    featured:
      data.featured ===
      true,

    published:
      data.published !==
      false,

    sortOrder:
      typeof data.sortOrder ===
      "number" &&
      Number.isFinite(
        data.sortOrder,
      )
        ? data.sortOrder
        : 0,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,

  };
}


/*
 * ==========================================================
 * CATEGORY LABEL
 * ==========================================================
 */

function categoryLabel(
  category:
    CustomPortfolioCategory,
): string {

  return category ===
    "devices"
    ? "Custom devices"
    : "Custom Website";
}


/*
 * ==========================================================
 * PROJECT STATUS LABEL
 * ==========================================================
 */

function projectStatusLabel(
  status:
    CustomProject["status"],
): string {

  switch (
    status
  ) {

    case "new":
      return "New";

    case "discussion":
      return "Discussion";

    case "quotation_sent":
      return "Quotation Sent";

    case "quotation_accepted":
      return "Quotation Accepted";

    case "payment_pending":
      return "Payment Pending";

    case "confirmed":
      return "Confirmed";

    case "in_development":
      return "In Development";

    case "review":
      return "Review";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return "New";
  }
}


/*
 * ==========================================================
 * PROJECT STATUS CLASS
 * ==========================================================
 */

function projectStatusClass(
  status:
    CustomProject["status"],
): string {

  switch (
    status
  ) {

    case "completed":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    case "payment_pending":
      return "bg-orange-50 text-orange-700";

    case "confirmed":
    case "quotation_accepted":
      return "bg-emerald-50 text-emerald-700";

    case "quotation_sent":
      return "bg-blue-50 text-blue-700";

    case "in_development":
      return "bg-purple-50 text-purple-700";

    case "review":
      return "bg-indigo-50 text-indigo-700";

    default:
      return "bg-neutral-100 text-neutral-700";
  }
}


/*
 * ==========================================================
 * QUOTATION LABEL
 * ==========================================================
 */

function quotationLabel(
  status:
    CustomProject["quotationStatus"],
): string {

  switch (
    status
  ) {

    case "sent":
      return "Quotation ready";

    case "accepted":
      return "Quotation accepted";

    case "rejected":
      return "Quotation rejected";

    case "expired":
      return "Quotation expired";

    case "cancelled":
      return "Quotation cancelled";

    default:
      return "Quotation pending";
  }
}


/*
 * ==========================================================
 * PAYMENT LABEL
 * ==========================================================
 */

function paymentLabel(
  status:
    CustomProject["paymentStatus"],
): string {

  switch (
    status
  ) {

    case "pending":
      return "Payment pending";

    case "processing":
      return "Payment processing";

    case "paid":
      return "Paid";

    case "failed":
      return "Payment failed";

    case "refunded":
      return "Refunded";

    default:
      return "No payment required";
  }
}


/*
 * ==========================================================
 * TIMESTAMP VALUE
 * ==========================================================
 */

function timestampValue(
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

      const possible =
        value as {
          toMillis?:
            unknown;

          toDate?:
            unknown;

          seconds?:
            unknown;
        };


      if (
        typeof possible.toMillis ===
        "function"
      ) {

        const milliseconds =
          (
            possible.toMillis as
              () => number
          )();


        return Number.isFinite(
          milliseconds,
        )
          ? milliseconds
          : 0;
      }


      if (
        typeof possible.toDate ===
        "function"
      ) {

        const date =
          (
            possible.toDate as
              () => Date
          )();


        return date instanceof Date
          ? date.getTime()
          : 0;
      }


      if (
        possible.seconds !==
        undefined
      ) {

        const seconds =
          Number(
            possible.seconds,
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


    if (
      typeof value ===
        "string" ||
      typeof value ===
        "number"
    ) {

      const time =
        new Date(
          value,
        ).getTime();


      return Number.isFinite(
        time,
      )
        ? time
        : 0;
    }


    return 0;

  } catch {

    return 0;
  }
}


/*
 * ==========================================================
 * DATE LABEL
 * ==========================================================
 */

function formatProjectDate(
  value:
    unknown,
): string {

  const timestamp =
    timestampValue(
      value,
    );


  if (
    timestamp <=
    0
  ) {

    return "";
  }


  return new Date(
    timestamp,
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
 * PAGE
 * ==========================================================
 */

export default function CustomSolutions() {

  const {
    user,
  } =
    useAuth();


  /*
   * ========================================================
   * PORTFOLIO
   * ========================================================
   */

  const [
    portfolio,
    setPortfolio,
  ] =
    useState<
      CustomPortfolioItem[]
    >([]);


  /*
   * ========================================================
   * CUSTOMER PROJECTS
   * ========================================================
   */

  const [
    projects,
    setProjects,
  ] =
    useState<
      CustomProject[]
    >([]);


  /*
   * ========================================================
   * PORTFOLIO LOADING
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
   * PROJECT LOADING
   * ========================================================
   */

  const [
    projectsLoading,
    setProjectsLoading,
  ] =
    useState(
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
    useState(
      "",
    );


  /*
   * ========================================================
   * PROJECT ERROR
   * ========================================================
   */

  const [
    projectsError,
    setProjectsError,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * REALTIME PORTFOLIO
   * ========================================================
   */

  useEffect(
    () => {

      const portfolioRef =
        collection(
          db,
          "customPortfolio",
        );


      const unsubscribe =
        onSnapshot(

          portfolioRef,

          (
            snapshot,
          ) => {

            const items =
              snapshot.docs
                .map(
                  (
                    document,
                  ) =>
                    normalizePortfolio(
                      document.id,
                      document.data(),
                    ),
                )
                .filter(
                  (
                    item,
                  ) =>
                    item.published,
                )
                .sort(
                  (
                    first,
                    second,
                  ) => {

                    if (
                      first.featured !==
                      second.featured
                    ) {

                      return first.featured
                        ? -1
                        : 1;
                    }


                    return (
                      first.sortOrder -
                      second.sortOrder
                    );

                  },
                );


            setPortfolio(
              items,
            );


            setLoading(
              false,
            );


            setError(
              "",
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Custom portfolio listener failed:",
              listenerError,
            );


            setError(
              listenerError instanceof Error
                ? listenerError.message
                : "Portfolio is temporarily unavailable.",
            );


            setLoading(
              false,
            );

          },

        );


      return () =>
        unsubscribe();

    },
    [],
  );


  /*
   * ========================================================
   * REALTIME CUSTOMER PROJECTS
   * ========================================================
   *
   * IMPORTANT:
   *
   * We query by userId only and sort in JavaScript.
   * This avoids requiring an additional composite Firestore
   * index for userId + createdAt.
   * ========================================================
   */

  useEffect(
    () => {

      if (
        !user
      ) {

        setProjects(
          [],
        );

        setProjectsLoading(
          false,
        );

        setProjectsError(
          "",
        );

        return;
      }


      setProjectsLoading(
        true,
      );


      setProjectsError(
        "",
      );


      const projectsRef =
        collection(
          db,
          "customProjects",
        );


      const projectsQuery =
        query(
          projectsRef,
          where(
            "userId",
            "==",
            user.uid,
          ),
        );


      const unsubscribe =
        onSnapshot(

          projectsQuery,

          (
            snapshot,
          ) => {

            const customerProjects =
              snapshot.docs.map(
                (
                  document,
                ) => ({
                  id:
                    document.id,

                  ...(
                    document.data() as
                      Omit<
                        CustomProject,
                        "id"
                      >
                  ),

                }),
              );


            customerProjects.sort(
              (
                first,
                second,
              ) =>
                timestampValue(
                  second.createdAt,
                ) -
                timestampValue(
                  first.createdAt,
                ),
            );


            setProjects(
              customerProjects,
            );


            setProjectsLoading(
              false,
            );


            setProjectsError(
              "",
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Customer custom projects listener failed:",
              listenerError,
            );


            setProjects(
              [],
            );


            setProjectsLoading(
              false,
            );


            setProjectsError(
              listenerError instanceof Error
                ? listenerError.message
                : "Unable to load your previous projects.",
            );

          },

        );


      return () =>
        unsubscribe();

    },
    [
      user,
    ],
  );


  /*
   * ========================================================
   * SHOWCASE
   * ========================================================
   */

  const showcase =
    useMemo(
      () =>
        portfolio.slice(
          0,
          6,
        ),

      [
        portfolio,
      ],
    );


  /*
   * ========================================================
   * ACTIVE PROJECTS
   * ========================================================
   */

  const activeProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project,
          ) =>
            project.status !==
              "completed" &&
            project.status !==
              "cancelled",
        ),

      [
        projects,
      ],
    );


  /*
   * ========================================================
   * COMPLETED PROJECTS
   * ========================================================
   */

  const completedProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project,
          ) =>
            project.status ===
            "completed",
        ),

      [
        projects,
      ],
    );


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (

    <main className="min-h-screen bg-white">

      {/* ====================================================
          HERO
      ===================================================== */}

      <section className="border-b border-neutral-100 bg-gradient-to-b from-white to-[#f8f6ef]">

        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">

          <div className="max-w-4xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#9b7e1d]">

              <Sparkles
                size={14}
              />

              Custom Solutions

            </div>


            <h1 className="mt-6 text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl lg:text-7xl">

              Bring your

              <span className="text-[#D4AF37]">
                {" "}
                idea
              </span>

              {" "}to life.

            </h1>


            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 sm:text-xl">

              We build custom websites and custom devices
              tailored to your requirements.

            </p>


            <div className="mt-9 flex flex-wrap gap-3">

              <Link
                to="/custom-solutions/request?type=website"

                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white transition hover:bg-[#b99622]"
              >

                Build a Website

                <ArrowRight
                  size={16}
                />

              </Link>


              <Link
                to="/custom-solutions/request?type=custom-devices"

                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-7 py-4 text-sm font-black text-neutral-900 transition hover:border-[#D4AF37]"
              >

                Build a Device

                <Cpu
                  size={16}
                />

              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* ====================================================
          MY PROJECTS
      ===================================================== */}

      {user && (

        <section className="border-b border-neutral-100 bg-white">

          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                  Your Work
                </p>


                <h2 className="mt-3 text-4xl font-black tracking-tight text-neutral-950">
                  My Custom Projects
                </h2>


                <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-500">
                  See every custom website and custom device request
                  you have submitted to Nexletronics.
                </p>

              </div>


              <Link
                to="/custom-solutions/request"

                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-black text-neutral-800 transition hover:border-[#D4AF37] hover:text-[#9b7e1d]"
              >

                New Project

                <ArrowRight
                  size={15}
                />

              </Link>

            </div>


            {/* ==================================================
                LOADING
            =================================================== */}

            {projectsLoading && (

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {
                  Array.from({
                    length: 3,
                  }).map(
                    (
                      _,
                      index,
                    ) => (

                      <div
                        key={
                          index
                        }

                        className="h-64 animate-pulse rounded-3xl bg-neutral-100"
                      />

                    ),
                  )
                }

              </div>

            )}


            {/* ==================================================
                ERROR
            =================================================== */}

            {!projectsLoading &&
              projectsError && (

              <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">

                <div className="flex items-start gap-3">

                  <FileText
                    size={20}
                    className="mt-0.5 shrink-0 text-red-600"
                  />


                  <div>

                    <p className="font-black text-red-900">
                      Unable to load your projects
                    </p>


                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {
                        projectsError
                      }
                    </p>

                  </div>

                </div>

              </div>

            )}


            {/* ==================================================
                EMPTY
            =================================================== */}

            {!projectsLoading &&
              !projectsError &&
              projects.length ===
                0 && (

              <div className="mt-8 rounded-3xl border border-dashed border-neutral-300 bg-[#faf9f5] p-10 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

                  <FileText
                    size={25}
                  />

                </div>


                <h3 className="mt-5 text-xl font-black text-neutral-950">
                  No custom projects yet
                </h3>


                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
                  Your previous custom website and custom device
                  requests will appear here after you submit them.
                </p>


                <Link
                  to="/custom-solutions/request"

                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white"
                >

                  Start Your First Project

                  <ArrowRight
                    size={15}
                  />

                </Link>

              </div>

            )}


            {/* ==================================================
                PROJECT CARDS
            =================================================== */}

            {!projectsLoading &&
              !projectsError &&
              projects.length >
                0 && (

              <>

                {/* ACTIVE */}

                {activeProjects.length >
                  0 && (

                  <div className="mt-8">

                    <div className="mb-4 flex items-center gap-2">

                      <Clock3
                        size={17}
                        className="text-[#D4AF37]"
                      />


                      <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                        Active Projects
                      </h3>

                    </div>


                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                      {
                        activeProjects.map(
                          (
                            project,
                          ) => (

                            <CustomerProjectCard
                              key={
                                project.id
                              }

                              project={
                                project
                              }
                            />

                          ),
                        )
                      }

                    </div>

                  </div>

                )}


                {/* COMPLETED */}

                {completedProjects.length >
                  0 && (

                  <div className="mt-10">

                    <div className="mb-4 flex items-center gap-2">

                      <CheckCircle2
                        size={17}
                        className="text-green-600"
                      />


                      <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                        Completed Projects
                      </h3>

                    </div>


                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                      {
                        completedProjects.map(
                          (
                            project,
                          ) => (

                            <CustomerProjectCard
                              key={
                                project.id
                              }

                              project={
                                project
                              }
                            />

                          ),
                        )
                      }

                    </div>

                  </div>

                )}

              </>

            )}

          </div>

        </section>

      )}


      {/* ====================================================
          SERVICES
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">

        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
          What We Build
        </p>


        <h2 className="mt-3 text-4xl font-black tracking-tight text-neutral-950">
          Choose your project
        </h2>


        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-500">
          Two focused services for custom software and physical products.
        </p>


        <div className="mt-10 grid gap-6 lg:grid-cols-2">

          <ServiceCard
            icon={
              Globe2
            }

            title="Custom Website"

            description="Business website, portfolio, e-commerce platform, dashboard or custom web application."

            features={[
              "Business websites",
              "E-commerce",
              "Custom dashboards",
              "Web applications",
            ]}

            requestType="website"
          />


          <ServiceCard
            icon={
              Cpu
            }

            title="Custom devices"

            description="Turn an idea into a physical product, electronic device or custom prototype."

            features={[
              "Custom electronics",
              "IoT devices",
              "Embedded systems",
              "Product prototypes",
            ]}

            requestType="custom-devices"
          />

        </div>

      </section>


      {/* ====================================================
          PROCESS
      ===================================================== */}

      <section className="border-y border-neutral-100 bg-[#faf9f5]">

        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            How It Works
          </p>


          <h2 className="mt-3 text-4xl font-black text-neutral-950">
            From idea to delivery
          </h2>


          <div className="mt-10 grid gap-5 md:grid-cols-4">

            <ProcessStep
              number="01"
              title="Tell us"
              text="Submit your project requirements."
            />


            <ProcessStep
              number="02"
              title="Discuss"
              text="Work with our team to refine the scope."
            />


            <ProcessStep
              number="03"
              title="Quotation"
              text="Receive a detailed project quotation."
            />


            <ProcessStep
              number="04"
              title="Build"
              text="Approve, pay and move into development."
            />

          </div>

        </div>

      </section>


      {/* ====================================================
          PORTFOLIO
      ===================================================== */}

      <section
        id="our-work"
        className="bg-neutral-950"
      >

        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Our Work
          </p>


          <h2 className="mt-3 text-4xl font-black text-white">
            Selected projects
          </h2>


          <p className="mt-4 max-w-2xl text-neutral-400">
            Websites and custom devices developed by Nexletronics.
          </p>


          {/* LOADING */}

          {loading && (

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {
                Array.from({
                  length: 3,
                }).map(
                  (
                    _item,
                    index,
                  ) => (

                    <div
                      key={
                        index
                      }

                      className="h-72 animate-pulse rounded-3xl bg-white/5"
                    />

                  ),
                )
              }

            </div>

          )}


          {/* ERROR */}

          {!loading &&
            error && (

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-neutral-400">

              {
                error
              }

            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            showcase.length ===
              0 && (

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">

              <Sparkles
                size={28}
                className="mx-auto text-[#D4AF37]"
              />


              <h3 className="mt-4 text-xl font-black text-white">
                Our portfolio is growing
              </h3>


              <p className="mt-2 text-sm text-neutral-400">
                New work will appear here soon.
              </p>

            </div>

          )}


          {/* SHOWCASE */}

          {!loading &&
            !error &&
            showcase.length >
              0 && (

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {
                showcase.map(
                  (
                    item,
                  ) => (

                    <article
                      key={
                        item.id
                      }

                      className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                    >

                      <div className="aspect-[16/10] bg-neutral-900">

                        {item.coverImage ? (

                          <img
                            src={
                              item.coverImage
                            }

                            alt={
                              item.title
                            }

                            className="h-full w-full object-cover"
                          />

                        ) : (

                          <div className="flex h-full items-center justify-center">

                            <MonitorSmartphone
                              size={40}
                              className="text-[#D4AF37]"
                            />

                          </div>

                        )}

                      </div>


                      <div className="p-6">

                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">

                          {
                            categoryLabel(
                              item.category,
                            )
                          }

                        </span>


                        <h3 className="mt-4 text-xl font-black text-white">

                          {
                            item.title
                          }

                        </h3>


                        <p className="mt-2 text-sm leading-6 text-neutral-400">

                          {
                            item.shortDescription
                          }

                        </p>


                        <div className="mt-5 flex flex-wrap gap-4">

                          <Link
                            to={`/custom-solutions/work/${item.id}`}

                            className="inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37]"
                          >

                            View Project

                            <ArrowRight
                              size={14}
                            />

                          </Link>


                          {item.liveUrl && (

                            <a
                              href={
                                item.liveUrl
                              }

                              target="_blank"

                              rel="noreferrer"

                              className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-white"
                            >

                              Live Site

                              <ExternalLink
                                size={14}
                              />

                            </a>

                          )}

                        </div>

                      </div>

                    </article>

                  ),
                )
              }

            </div>

          )}

        </div>

      </section>


      {/* ====================================================
          CTA
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">

        <div className="rounded-[2rem] bg-[#D4AF37] px-7 py-12 sm:px-10 lg:px-14">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-2xl">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                Ready to build?
              </p>


              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Tell us what you're trying to create.
              </h2>


              <p className="mt-4 text-white/80">
                Submit your requirements and discuss the project
                with Nexletronics before confirming the quotation.
              </p>

            </div>


            <Link
              to="/custom-solutions/request"

              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-neutral-950"
            >

              Start a Project

              <ArrowRight
                size={16}
              />

            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}


/*
 * ==========================================================
 * CUSTOMER PROJECT CARD
 * ==========================================================
 */

function CustomerProjectCard({
  project,
}: {
  project:
    CustomProject;
}) {

  const isDevices =
    project.projectType ===
    "custom-devices";


  const status =
    projectStatusLabel(
      project.status,
    );


  const statusClass =
    projectStatusClass(
      project.status,
    );


  const date =
    formatProjectDate(
      project.createdAt,
    );


  const hasQuotation =
    Boolean(
      project.activeQuotationId,
    );


  const paymentPending =
    project.paymentStatus ===
    "pending";


  return (

    <article className="group rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

          {isDevices ? (

            <Cpu
              size={22}
            />

          ) : (

            <Globe2
              size={22}
            />

          )}

        </div>


        <span
          className={[
            "rounded-full px-3 py-1.5 text-[10px] font-black",
            statusClass,
          ].join(" ")}
        >

          {
            status
          }

        </span>

      </div>


      {/* PROJECT */}

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">

        {
          project.projectNumber
        }

      </p>


      <h3 className="mt-2 text-xl font-black text-neutral-950">

        {
          project.title
        }

      </h3>


      <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-500">

        {
          project.description
        }

      </p>


      {/* INFO */}

      <div className="mt-5 space-y-3">

        <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">

          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            Type
          </span>


          <span className="text-right text-xs font-bold text-neutral-800">

            {
              isDevices
                ? "Custom devices"
                : "Custom Website"
            }

          </span>

        </div>


        <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">

          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            Quotation
          </span>


          <span className="text-right text-xs font-bold text-neutral-800">

            {
              quotationLabel(
                project.quotationStatus,
              )
            }

          </span>

        </div>


        <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">

          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            Payment
          </span>


          <span
            className={[
              "text-right text-xs font-bold",
              paymentPending
                ? "text-orange-700"
                : project.paymentStatus ===
                    "paid"
                  ? "text-green-700"
                  : "text-neutral-800",
            ].join(" ")}
          >

            {
              paymentLabel(
                project.paymentStatus,
              )
            }

          </span>

        </div>

      </div>


      {/* FOOTER */}

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-neutral-100 pt-5">

        <div>

          {date && (

            <p className="text-xs text-neutral-400">

              Submitted{" "}

              {
                date
              }

            </p>

          )}


          {project.lastMessage && (

            <p className="mt-1 flex max-w-[170px] items-center gap-1 truncate text-xs font-bold text-neutral-500">

              <MessageCircle
                size={12}
              />

              {
                project.lastMessage
              }

            </p>

          )}

        </div>


        <Link
          to={`/custom-solutions/projects/${project.id}`}

          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-black text-white transition hover:bg-[#b99622]"
        >

          Open Project

          <ArrowRight
            size={14}
          />

        </Link>

      </div>


      {/* PAYMENT CTA */}

      {hasQuotation &&
        paymentPending &&
        project.activeQuotationId && (

        <Link
          to={`/custom-solutions/projects/${project.id}/payment/${project.activeQuotationId}`}

          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-xs font-black text-orange-700 transition hover:bg-orange-100"
        >

          <CreditCardIcon />

          Continue to Payment

        </Link>

      )}

    </article>
  );
}


/*
 * ==========================================================
 * CREDIT CARD ICON
 * ==========================================================
 */

function CreditCardIcon() {

  return (

    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >

      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
      />

      <line
        x1="2"
        y1="10"
        x2="22"
        y2="10"
      />

    </svg>
  );
}


/*
 * ==========================================================
 * SERVICE CARD
 * ==========================================================
 */

function ServiceCard({
  icon:
    Icon,

  title,

  description,

  features,

  requestType,
}: {
  icon:
    typeof Globe2;

  title:
    string;

  description:
    string;

  features:
    string[];

  requestType:
    "website" |
    "custom-devices";
}) {

  return (

    <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

        <Icon
          size={27}
        />

      </div>


      <h3 className="mt-6 text-2xl font-black text-neutral-950">

        {
          title
        }

      </h3>


      <p className="mt-3 leading-7 text-neutral-600">

        {
          description
        }

      </p>


      <div className="mt-7 grid gap-3 sm:grid-cols-2">

        {
          features.map(
            (
              feature,
            ) => (

              <div
                key={
                  feature
                }

                className="flex items-center gap-2 text-sm font-semibold text-neutral-700"
              >

                <CheckCircle2
                  size={17}
                  className="shrink-0 text-green-600"
                />

                {
                  feature
                }

              </div>

            ),
          )
        }

      </div>


      <Link
        to={
          `/custom-solutions/request?type=${requestType}`
        }

        className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#9b7e1d]"
      >

        Start with this service

        <ArrowRight
          size={15}
        />

      </Link>

    </div>
  );
}


/*
 * ==========================================================
 * PROCESS STEP
 * ==========================================================
 */

function ProcessStep({
  number,
  title,
  text,
}: {
  number:
    string;

  title:
    string;

  text:
    string;
}) {

  return (

    <div className="rounded-3xl border border-neutral-200 bg-white p-6">

      <span className="text-sm font-black text-[#D4AF37]">

        {
          number
        }

      </span>


      <h3 className="mt-5 font-black text-neutral-950">

        {
          title
        }

      </h3>


      <p className="mt-2 text-sm leading-6 text-neutral-500">

        {
          text
        }

      </p>

    </div>
  );
}