import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Wrench,
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
  getServices,
} from "../../services/service.service";

import type {
  Service,
} from "../../types/service";


/*
 * ==========================================================
 * PUBLIC SERVICES PAGE
 * ==========================================================
 */

export default function Services() {
  const [
    services,
    setServices,
  ] = useState<Service[]>([]);


  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);


  const [
    error,
    setError,
  ] = useState<string>("");


  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string>("All");


  /*
   * ========================================================
   * LOAD SERVICES
   * ========================================================
   */

  useEffect(() => {
    let mounted = true;


    async function loadServices() {
      try {
        setLoading(true);
        setError("");


        const data =
          await getServices();


        if (!mounted) {
          return;
        }


        /*
         * Only show active services publicly.
         */

        const activeServices =
          data.filter(
            (
              service,
            ) =>
              service.active,
          );


        setServices(
          activeServices,
        );
      } catch (err) {
        console.error(
          "Failed to load services:",
          err,
        );


        if (mounted) {
          setError(
            "Unable to load services right now.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }


    void loadServices();


    return () => {
      mounted = false;
    };
  }, []);


  /*
   * ========================================================
   * CATEGORIES
   * ========================================================
   */

  const categories =
    useMemo(() => {
      const values =
        services
          .map(
            (
              service,
            ) =>
              service.category,
          )
          .filter(
            Boolean,
          );


      return [
        "All",
        ...Array.from(
          new Set(
            values,
          ),
        ),
      ];
    }, [services]);


  /*
   * ========================================================
   * FILTERED SERVICES
   * ========================================================
   */

  const filteredServices =
    useMemo(() => {
      if (
        selectedCategory ===
        "All"
      ) {
        return services;
      }


      return services.filter(
        (
          service,
        ) =>
          service.category ===
          selectedCategory,
      );
    }, [
      services,
      selectedCategory,
    ]);


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div>

      {/* ====================================================
          HERO
      ===================================================== */}

      <section className="gradient-hero py-24 sm:py-28">

        <div className="container-custom">

          <p className="font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Our Services
          </p>


          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl">
            Technology services built around your ideas.
          </h1>


          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
            From rapid prototypes and 3D printing to custom
            electronics, software and automation, Nexletronics
            helps turn practical ideas into working solutions.
          </p>

        </div>

      </section>


      {/* ====================================================
          SERVICES
      ===================================================== */}

      <section className="section">

        <div className="container-custom">

          {/* Categories */}

          {!loading &&
            categories.length >
              1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">

                {categories.map(
                  (
                    category,
                  ) => {

                    const active =
                      selectedCategory ===
                      category;


                    return (
                      <button
                        key={
                          category
                        }
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            category,
                          )
                        }
                        className={[
                          "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition",
                          active
                            ? "bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/20"
                            : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#D4AF37] hover:text-[#D4AF37]",
                        ].join(
                          " ",
                        )}
                      >
                        {
                          category
                        }
                      </button>
                    );
                  },
                )}

              </div>
            )}


          {/* Loading */}

          {loading && (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-[#D4AF37]"
                />

                <p className="mt-4 text-sm text-neutral-500">
                  Loading services...
                </p>

              </div>

            </div>
          )}


          {/* Error */}

          {!loading &&
            error && (
              <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
                {
                  error
                }
              </div>
            )}


          {/* Empty */}

          {!loading &&
            !error &&
            filteredServices.length ===
              0 && (
              <div className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-white p-14 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

                  <Wrench
                    size={28}
                  />

                </div>


                <h2 className="mt-5 text-2xl font-black text-neutral-950">
                  No services available
                </h2>


                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                  Our available services will appear here.
                </p>


                <Link
                  to="/contact"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-[#D4AF37]"
                >
                  Contact Us

                  <ArrowRight
                    size={15}
                  />

                </Link>

              </div>
            )}


          {/* Services grid */}

          {!loading &&
            !error &&
            filteredServices.length >
              0 && (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {filteredServices.map(
                  (
                    service,
                  ) => (

                    <article
                      key={
                        service.id
                      }
                      className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                    >

                      {/* Image */}

                      <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#faf8f0]">

                        {service.image ? (
                          <img
                            src={
                              service.image
                            }
                            alt={
                              service.name
                            }
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-[#D4AF37] shadow-sm">

                            <Wrench
                              size={34}
                            />

                          </div>
                        )}


                        {service.featured && (
                          <span className="absolute left-4 top-4 rounded-full bg-[#D4AF37] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
                            Featured
                          </span>
                        )}

                      </div>


                      {/* Content */}

                      <div className="p-7">

                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                          {
                            service.category
                          }
                        </p>


                        <h2 className="mt-2 text-2xl font-black text-neutral-950">
                          {
                            service.name
                          }
                        </h2>


                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-neutral-600">
                          {
                            service.shortDescription
                          }
                        </p>


                        {/* Features */}

                        <div className="mt-5 space-y-2">

                          <div className="flex items-center gap-2 text-xs text-neutral-500">

                            <CheckCircle2
                              size={14}
                              className="text-[#D4AF37]"
                            />

                            Professional delivery

                          </div>


                          <div className="flex items-center gap-2 text-xs text-neutral-500">

                            <CheckCircle2
                              size={14}
                              className="text-[#D4AF37]"
                            />

                            Project-focused support

                          </div>

                        </div>


                        {/* Price */}

                        <div className="mt-6 flex items-end justify-between gap-4 border-t border-neutral-100 pt-5">

                          <div>

                            <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                              {
                                service.priceLabel ||
                                "Starting from"
                              }
                            </p>


                            <p className="mt-1 text-xl font-black text-neutral-950">

                              {service.price !==
                              undefined
                                ? `₹${service.price.toLocaleString(
                                    "en-IN",
                                  )}`
                                : "Contact us"}

                            </p>

                          </div>


                          <Link
                            to={`/contact?service=${encodeURIComponent(
                              service.name,
                            )}`}
                            className="inline-flex items-center gap-1 text-sm font-black text-[#9b7e1d] transition hover:text-[#D4AF37]"
                          >
                            Enquire

                            <ArrowRight
                              size={15}
                              className="transition-transform group-hover:translate-x-1"
                            />

                          </Link>

                        </div>

                      </div>

                    </article>

                  ),
                )}

              </div>
            )}

        </div>

      </section>


      {/* ====================================================
          CTA
      ===================================================== */}

      <section className="section pt-0">

        <div className="container-custom">

          <div className="overflow-hidden rounded-[2rem] bg-neutral-950 px-7 py-12 text-white sm:px-12 sm:py-16">

            <div className="max-w-3xl">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Have a project in mind?
              </p>


              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                Tell us what you're building.
              </h2>


              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
                Share your requirements and our team can help
                you choose the right service or create a custom
                solution.
              </p>


              <Link
                to="/contact"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622]"
              >
                Start a Project

                <ArrowRight
                  size={16}
                />

              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}