import {
  Edit3,
  Globe,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  createService,
  deleteService,
  updateService,
} from "../../../services/service.service";

import {
  subscribeToCollection,
  type RealtimeDocument,
} from "../../../services/realtime.service";

import type {
  Service,
} from "../../../types/service";


/*
 * ==========================================================
 * CATEGORIES
 * ==========================================================
 */

const serviceCategories: string[] = [
  "3D Printing",
  "Custom Projects",
  "Software",
  "IoT & Automation",
  "PCB & Prototyping",
  "Consulting",
];


/*
 * ==========================================================
 * SLUG
 * ==========================================================
 */

function makeSlug(
  value: string,
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "");
}


/*
 * ==========================================================
 * SERVICE NORMALIZER
 * ==========================================================
 */

function normalizeService(
  id: string,
  data: Partial<Service>,
): Service {
  return {
    id,

    name:
      data.name ??
      "Unnamed service",

    slug:
      data.slug ??
      "",

    category:
      data.category ??
      "Technology Services",

    shortDescription:
      data.shortDescription ??
      "",

    description:
      data.description ??
      "",

    price:
      data.price,

    priceLabel:
      data.priceLabel,

    image:
      data.image,

    featured:
      data.featured ??
      false,

    active:
      data.active ??
      true,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}


/*
 * ==========================================================
 * TIMESTAMP
 * ==========================================================
 */

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
        ) * 1000
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


/*
 * ==========================================================
 * SERVICE FORM
 * ==========================================================
 */

function ServiceForm({
  service,
  onClose,
}: {
  service: Service | null;

  onClose: () => void;
}) {

  const isEditing =
    service !== null;


  const [
    name,
    setName,
  ] = useState<string>(
    service?.name ??
      "",
  );


  const [
    category,
    setCategory,
  ] = useState<string>(
    service?.category ??
      serviceCategories[0],
  );


  const [
    shortDescription,
    setShortDescription,
  ] = useState<string>(
    service?.shortDescription ??
      "",
  );


  const [
    description,
    setDescription,
  ] = useState<string>(
    service?.description ??
      "",
  );


  const [
    priceLabel,
    setPriceLabel,
  ] = useState<string>(
    service?.priceLabel ??
      "",
  );


  const [
    price,
    setPrice,
  ] = useState<string>(
    service?.price !==
    undefined
      ? String(
          service.price,
        )
      : "",
  );


  const [
    image,
    setImage,
  ] = useState<string>(
    service?.image ??
      "",
  );


  const [
    featured,
    setFeatured,
  ] = useState<boolean>(
    service?.featured ??
      false,
  );


  const [
    active,
    setActive,
  ] = useState<boolean>(
    service?.active ??
      true,
  );


  const [
    saving,
    setSaving,
  ] = useState<boolean>(
    false,
  );


  const [
    error,
    setError,
  ] = useState<string>(
    "",
  );


  /*
   * ========================================================
   * SUBMIT
   * ========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    setError(
      "",
    );


    const cleanName =
      name.trim();

    const cleanShort =
      shortDescription.trim();

    const cleanDescription =
      description.trim();

    const cleanImage =
      image.trim();

    const cleanPriceLabel =
      priceLabel.trim();

    const parsedPrice =
      price.trim() === ""
        ? undefined
        : Number(
            price,
          );


    if (!cleanName) {

      setError(
        "Service name is required.",
      );

      return;
    }


    if (!cleanShort) {

      setError(
        "Short description is required.",
      );

      return;
    }


    if (!cleanDescription) {

      setError(
        "Service description is required.",
      );

      return;
    }


    if (
      parsedPrice !==
        undefined &&
      (
        !Number.isFinite(
          parsedPrice,
        ) ||
        parsedPrice < 0
      )
    ) {

      setError(
        "Enter a valid starting price.",
      );

      return;
    }


    setSaving(
      true,
    );


    try {

      const serviceData = {

        name:
          cleanName,

        slug:
          makeSlug(
            cleanName,
          ),

        category,

        shortDescription:
          cleanShort,

        description:
          cleanDescription,

        price:
          parsedPrice,

        priceLabel:
          cleanPriceLabel,

        image:
          cleanImage,

        featured,

        active,
      };


      if (
        service ===
        null
      ) {

        await createService(
          serviceData,
        );

      } else {

        await updateService(
          service.id,
          serviceData,
        );
      }


      /*
       * Do not reload the list here.
       *
       * Firestore onSnapshot() will deliver the create/update
       * event automatically.
       */

      onClose();

    } catch (err) {

      console.error(
        "Failed to save service:",
        err,
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to save service.",
      );

    } finally {

      setSaving(
        false,
      );
    }
  }


  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={
        isEditing
          ? "Edit service"
          : "Add service"
      }
    >

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Service Management
            </p>


            <h2 className="mt-1 text-2xl font-black text-neutral-950">
              {isEditing
                ? "Edit Service"
                : "Add Service"}
            </h2>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Close"
          >

            <X
              size={18}
            />

          </button>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 p-6 sm:p-8"
        >

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          {/* NAME */}

          <div>

            <label
              htmlFor="service-name"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Service Name
            </label>


            <input
              id="service-name"
              type="text"
              required
              value={
                name
              }
              onChange={(
                event,
              ) =>
                setName(
                  event.target
                    .value,
                )
              }
              placeholder="Custom 3D Printing"
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* CATEGORY */}

          <div>

            <label
              htmlFor="service-category"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Category
            </label>


            <select
              id="service-category"
              value={
                category
              }
              onChange={(
                event,
              ) =>
                setCategory(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            >

              {serviceCategories.map(
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
                    {
                      item
                    }
                  </option>

                ),
              )}

            </select>

          </div>


          {/* SHORT DESCRIPTION */}

          <div>

            <label
              htmlFor="service-short"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Short Description
            </label>


            <input
              id="service-short"
              type="text"
              required
              value={
                shortDescription
              }
              onChange={(
                event,
              ) =>
                setShortDescription(
                  event.target
                    .value,
                )
              }
              placeholder="Professional custom 3D printing for prototypes and projects."
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* DESCRIPTION */}

          <div>

            <label
              htmlFor="service-description"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Full Description
            </label>


            <textarea
              id="service-description"
              required
              rows={6}
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
                )
              }
              placeholder="Explain the service, process, deliverables and ideal use cases."
              className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm leading-6 outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* PRICE */}

          <div className="grid gap-5 sm:grid-cols-2">

            <div>

              <label
                htmlFor="service-price"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Starting Price
              </label>


              <input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                value={
                  price
                }
                onChange={(
                  event,
                ) =>
                  setPrice(
                    event.target
                      .value,
                  )
                }
                placeholder="499"
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="service-price-label"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Price Label
              </label>


              <input
                id="service-price-label"
                type="text"
                value={
                  priceLabel
                }
                onChange={(
                  event,
                ) =>
                  setPriceLabel(
                    event.target
                      .value,
                  )
                }
                placeholder="Starting from"
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>

          </div>


          {/* IMAGE */}

          <div>

            <label
              htmlFor="service-image"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Image URL
            </label>


            <input
              id="service-image"
              type="url"
              value={
                image
              }
              onChange={(
                event,
              ) =>
                setImage(
                  event.target
                    .value,
                )
              }
              placeholder="https://..."
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            />

          </div>


          {/* SETTINGS */}

          <div className="grid gap-4 sm:grid-cols-2">

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4">

              <input
                type="checkbox"
                checked={
                  active
                }
                onChange={(
                  event,
                ) =>
                  setActive(
                    event.target
                      .checked,
                  )
                }
                className="mt-1 h-5 w-5 accent-[#D4AF37]"
              />


              <div>

                <p className="text-sm font-bold">
                  Active
                </p>


                <p className="mt-1 text-xs text-neutral-500">
                  Show this service publicly.
                </p>

              </div>

            </label>


            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4">

              <input
                type="checkbox"
                checked={
                  featured
                }
                onChange={(
                  event,
                ) =>
                  setFeatured(
                    event.target
                      .checked,
                  )
                }
                className="mt-1 h-5 w-5 accent-[#D4AF37]"
              />


              <div>

                <p className="text-sm font-bold">
                  Featured
                </p>


                <p className="mt-1 text-xs text-neutral-500">
                  Highlight this service.
                </p>

              </div>

            </label>

          </div>


          {/* BUTTONS */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-full border border-neutral-200 px-6 py-3.5 text-sm font-bold text-neutral-700"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Service"
                  : "Create Service"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * SERVICE MANAGER
 * ==========================================================
 */

export default function ServiceManager() {

  const [
    services,
    setServices,
  ] = useState<Service[]>(
    [],
  );


  const [
    loading,
    setLoading,
  ] = useState<boolean>(
    true,
  );


  const [
    error,
    setError,
  ] = useState<string>(
    "",
  );


  const [
    search,
    setSearch,
  ] = useState<string>(
    "",
  );


  const [
    selectedService,
    setSelectedService,
  ] = useState<Service | null>(
    null,
  );


  const [
    formOpen,
    setFormOpen,
  ] = useState<boolean>(
    false,
  );


  /*
   * ========================================================
   * REALTIME SERVICES
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
      subscribeToCollection<
        Partial<Service>
      >(
        "services",

        (
          items: RealtimeDocument<
            Partial<Service>
          >[],
        ) => {

          const nextServices =
            items.map(
              (
                item,
              ) =>
                normalizeService(
                  item.id,
                  item.data,
                ),
            );


          nextServices.sort(
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


          setServices(
            nextServices,
          );


          /*
           * Keep an open edit modal synchronized if the
           * same service changes from another admin tab.
           */

          setSelectedService(
            (
              current,
            ) => {

              if (!current) {
                return current;
              }


              return (
                nextServices.find(
                  (
                    service,
                  ) =>
                    service.id ===
                    current.id,
                ) ??
                null
              );
            },
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
              "Realtime services listener failed:",
              listenerError,
            );


            setError(
              "Unable to connect to the realtime services database.",
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
   * FILTER
   * ========================================================
   */

  const filteredServices =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return services.filter(
          (
            service,
          ) =>

            query === "" ||

            service.name
              .toLowerCase()
              .includes(
                query,
              ) ||

            service.category
              .toLowerCase()
              .includes(
                query,
              ) ||

            service.description
              .toLowerCase()
              .includes(
                query,
              ),
        );

      },
      [
        services,
        search,
      ],
    );


  /*
   * ========================================================
   * DELETE
   * ========================================================
   */

  async function handleDelete(
    service: Service,
  ) {

    const confirmed =
      window.confirm(
        `Delete "${service.name}"?`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setError(
        "",
      );


      /*
       * Do not manually remove the service from React state.
       * Firestore's realtime delete event does that.
       */

      await deleteService(
        service.id,
      );

    } catch (err) {

      console.error(
        "Failed to delete service:",
        err,
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete service.",
      );
    }
  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {

    return (
      <div className="space-y-6">

        <div className="h-10 w-64 animate-pulse rounded bg-neutral-200" />

        <div className="h-20 animate-pulse rounded-3xl bg-neutral-100" />

        <div className="h-96 animate-pulse rounded-3xl bg-neutral-100" />

      </div>
    );
  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Service Management
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Services
          </h1>


          <p className="mt-2 text-sm text-neutral-500">
            Manage 3D printing, custom projects, software and other services.
          </p>

        </div>


        <div className="flex flex-wrap gap-3">

          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-5 py-3 text-sm font-bold text-green-700">

            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

            Live

          </div>


          <button
            type="button"
            onClick={() => {

              setSelectedService(
                null,
              );

              setFormOpen(
                true,
              );

            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20"
          >

            <Plus
              size={18}
            />

            Add Service

          </button>

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}


      {/* SEARCH */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

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
            placeholder="Search services..."
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-5 text-sm outline-none focus:border-[#D4AF37]"
          />

        </div>


        <p className="mt-4 text-xs font-semibold text-neutral-400">

          {
            filteredServices.length
          }{" "}

          service
          {
            filteredServices.length ===
            1
              ? ""
              : "s"
          }

        </p>

      </section>


      {/* EMPTY */}

      {filteredServices.length ===
      0 ? (

        <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-14 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Wrench
              size={28}
            />

          </div>


          <h2 className="mt-5 text-2xl font-black text-neutral-950">
            No services found
          </h2>


          <p className="mt-2 text-sm text-neutral-500">
            Add your first service to the Nexletronics website.
          </p>


          <button
            type="button"
            onClick={() => {

              setSelectedService(
                null,
              );

              setFormOpen(
                true,
              );

            }}
            className="mt-6 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white hover:bg-[#D4AF37]"
          >
            Add Service
          </button>

        </section>

      ) : (

        /* ==================================================
           GRID
        =================================================== */

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredServices.map(
            (
              service,
            ) => (

              <article
                key={
                  service.id
                }
                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >

                {/* IMAGE */}

                <div className="flex h-44 items-center justify-center bg-[#faf8f0]">

                  {service.image ? (

                    <img
                      src={
                        service.image
                      }
                      alt={
                        service.name
                      }
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <Wrench
                      size={42}
                      className="text-[#D4AF37]"
                    />

                  )}

                </div>


                <div className="p-6">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                        {
                          service.category
                        }
                      </span>


                      <h2 className="mt-2 text-xl font-black text-neutral-950">
                        {
                          service.name
                        }
                      </h2>

                    </div>


                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold",

                        service.active
                          ? "bg-green-50 text-green-700"
                          : "bg-neutral-100 text-neutral-500",
                      ].join(
                        " ",
                      )}
                    >
                      {
                        service.active
                          ? "Active"
                          : "Hidden"
                      }
                    </span>

                  </div>


                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-500">
                    {
                      service.shortDescription
                    }
                  </p>


                  <div className="mt-5 flex items-center justify-between">

                    <div>

                      <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                        Price
                      </p>


                      <p className="mt-1 font-black text-neutral-950">

                        {service.price !==
                        undefined
                          ? `₹${service.price.toLocaleString(
                              "en-IN",
                            )}`
                          : service.priceLabel ||
                            "Contact us"}

                      </p>

                    </div>


                    {service.featured && (
                      <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-bold text-[#8f741d]">
                        Featured
                      </span>
                    )}

                  </div>


                  <div className="mt-6 flex gap-2">

                    <button
                      type="button"
                      onClick={() => {

                        setSelectedService(
                          service,
                        );

                        setFormOpen(
                          true,
                        );

                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-xs font-bold text-neutral-700 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >

                      <Edit3
                        size={14}
                      />

                      Edit

                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(
                          service,
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-red-500 hover:border-red-200 hover:bg-red-50"
                      title="Delete service"
                    >

                      <Trash2
                        size={14}
                      />

                    </button>


                    <a
                      href="/services"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      title="View services page"
                    >

                      <Globe
                        size={14}
                      />

                    </a>

                  </div>

                </div>

              </article>

            ),
          )}

        </section>

      )}


      {/* FORM */}

      {formOpen && (
        <ServiceForm
          service={
            selectedService
          }
          onClose={() => {

            setFormOpen(
              false,
            );

            setSelectedService(
              null,
            );

          }}
        />
      )}

    </div>
  );
}