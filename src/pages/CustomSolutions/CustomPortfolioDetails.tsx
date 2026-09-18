import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe2,
  ImageIcon,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../../firebase/config";

import {
  subscribeCustomShowcaseSettings,
} from "../../services/customShowcase.service";

import type {
  CustomShowcaseSettings,
} from "../../services/customShowcase.service";

import type {
  CustomPortfolioCategory,
  CustomPortfolioItem,
} from "../../types/customProject";


/*
 * ==========================================================
 * NORMALIZE PORTFOLIO
 * ==========================================================
 */

function normalizePortfolioItem(
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


  const gallery =
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
      : [];


  const technologies =
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
      : [];


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

    gallery,

    technologies,

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

function getCategoryName(
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
 * PAGE
 * ==========================================================
 */

export default function CustomPortfolioDetails() {

  const {
    projectId,
  } =
    useParams<{
      projectId:
        string;
    }>();


  /*
   * ========================================================
   * PROJECT
   * ========================================================
   */

  const [
    item,
    setItem,
  ] =
    useState<
      CustomPortfolioItem |
      null
    >(null);


  /*
   * ========================================================
   * SETTINGS
   * ========================================================
   */

  const [
    settings,
    setSettings,
  ] =
    useState<
      CustomShowcaseSettings
    >({

      websitesEnabled:
        true,

      devicesEnabled:
        true,

    });


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
   * ACTIVE IMAGE
   * ========================================================
   */

  const [
    activeImage,
    setActiveImage,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * LIGHTBOX
   * ========================================================
   */

  const [
    lightboxOpen,
    setLightboxOpen,
  ] =
    useState(
      false,
    );


  /*
   * ========================================================
   * REALTIME PROJECT
   * ========================================================
   */

  useEffect(
    () => {

      if (
        !projectId
      ) {

        setItem(
          null,
        );


        setError(
          "Project was not found.",
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


      const projectReference =
        doc(
          db,
          "customPortfolio",
          projectId,
        );


      const unsubscribe =
        onSnapshot(

          projectReference,

          (
            snapshot,
          ) => {

            if (
              !snapshot.exists()
            ) {

              setItem(
                null,
              );


              setError(
                "This portfolio project does not exist.",
              );


              setLoading(
                false,
              );


              return;
            }


            const normalizedItem =
              normalizePortfolioItem(
                snapshot.id,
                snapshot.data(),
              );


            setItem(
              normalizedItem,
            );


            setError(
              "",
            );


            setLoading(
              false,
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Portfolio detail listener failed:",
              listenerError,
            );


            setError(
              listenerError instanceof Error
                ? listenerError.message
                : "Unable to load this project.",
            );


            setLoading(
              false,
            );

          },

        );


      return () =>
        unsubscribe();

    },
    [
      projectId,
    ],
  );


  /*
   * ========================================================
   * REALTIME SHOWCASE SETTINGS
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeCustomShowcaseSettings(

          (
            nextSettings,
          ) => {

            setSettings(
              nextSettings,
            );

          },

          (
            settingsError,
          ) => {

            console.error(
              "Showcase visibility listener failed:",
              settingsError,
            );


            /*
             * Safe fallback.
             */

            setSettings(
              {

                websitesEnabled:
                  true,

                devicesEnabled:
                  true,

              },
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
   * CATEGORY VISIBILITY
   * ========================================================
   */

  const categoryEnabled =
    item
      ? item.category ===
          "website"
        ? settings.websitesEnabled
        : settings.devicesEnabled
      : false;


  /*
   * ========================================================
   * GALLERY
   * ========================================================
   */

  const galleryImages =
    useMemo(
      () => {

        if (
          !item
        ) {

          return [];
        }


        const allImages =
          [
            item.coverImage,
            ...item.gallery,
          ]
            .filter(
              (
                image,
              ) =>
                image.trim().length >
                0,
            );


        return Array.from(
          new Set(
            allImages,
          ),
        );

      },
      [
        item,
      ],
    );


  /*
   * ========================================================
   * KEEP ACTIVE IMAGE VALID
   * ========================================================
   */

  useEffect(
    () => {

      if (
        galleryImages.length ===
        0
      ) {

        setActiveImage(
          "",
        );


        return;
      }


      setActiveImage(
        (
          currentImage,
        ) =>
          galleryImages.includes(
            currentImage,
          )
            ? currentImage
            : galleryImages[0],
      );

    },
    [
      galleryImages,
    ],
  );


  /*
   * ========================================================
   * PREVIOUS IMAGE
   * ========================================================
   */

  function previousImage() {

    if (
      galleryImages.length <
      2
    ) {

      return;
    }


    const currentIndex =
      galleryImages.indexOf(
        activeImage,
      );


    const previousIndex =
      currentIndex <=
        0
        ? galleryImages.length -
          1
        : currentIndex -
          1;


    setActiveImage(
      galleryImages[
        previousIndex
      ],
    );

  }


  /*
   * ========================================================
   * NEXT IMAGE
   * ========================================================
   */

  function nextImage() {

    if (
      galleryImages.length <
      2
    ) {

      return;
    }


    const currentIndex =
      galleryImages.indexOf(
        activeImage,
      );


    const nextIndex =
      currentIndex < 0 ||
      currentIndex >=
        galleryImages.length -
          1
        ? 0
        : currentIndex +
          1;


    setActiveImage(
      galleryImages[
        nextIndex
      ],
    );

  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-10">

          <div className="h-5 w-36 animate-pulse rounded bg-neutral-200" />


          <div className="mt-7 aspect-[16/8] animate-pulse rounded-[2rem] bg-neutral-200" />


          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">

            <div className="h-80 animate-pulse rounded-3xl bg-neutral-100" />

            <div className="h-80 animate-pulse rounded-3xl bg-neutral-100" />

          </div>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * NOT FOUND OR DISABLED
   * ========================================================
   */

  if (
    !item ||
    !categoryEnabled
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-16">

          <div className="w-full rounded-[2rem] border border-neutral-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <ImageIcon
                size={29}
              />

            </div>


            <h1 className="mt-6 text-3xl font-black text-neutral-950">

              {
                !item
                  ? "Project not found"
                  : "Project unavailable"
              }

            </h1>


            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-500">

              {
                !item
                  ? error ||
                    "This portfolio project is no longer available."
                  : "This showcase category is currently unavailable."
              }

            </p>


            <Link
              to="/custom-solutions"

              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white"
            >

              <ArrowLeft
                size={16}
              />

              Back to Custom Solutions

            </Link>

          </div>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * MAIN
   * ========================================================
   */

  return (

    <main className="min-h-screen bg-white">

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10 lg:py-14">

        {/* BACK */}

        <Link
          to="/custom-solutions"

          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 transition hover:text-[#9b7e1d]"
        >

          <ArrowLeft
            size={16}
          />

          Back to Custom Solutions

        </Link>


        {/* ==================================================
            MAIN IMAGE
        =================================================== */}

        <section className="mt-7 overflow-hidden rounded-[2rem] bg-neutral-950">

          {activeImage ? (

            <button
              type="button"

              onClick={() =>
                setLightboxOpen(
                  true,
                )
              }

              className="group block w-full text-left"
            >

              <div className="relative">

                <img
                  src={
                    activeImage
                  }

                  alt={
                    item.title
                  }

                  className="aspect-[16/8] w-full object-cover transition duration-500 group-hover:scale-[1.01]"
                />


                <span className="absolute bottom-5 right-5 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white backdrop-blur">
                  Click to enlarge
                </span>

              </div>

            </button>

          ) : (

            <div className="flex aspect-[16/8] items-center justify-center">

              <ImageIcon
                size={52}
                className="text-[#D4AF37]"
              />

            </div>

          )}

        </section>


        {/* ==================================================
            THUMBNAILS
        =================================================== */}

        {galleryImages.length >
          1 && (

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">

            {
              galleryImages.map(
                (
                  image,
                  index,
                ) => (

                  <button
                    key={
                      `${image}-${index}`
                    }

                    type="button"

                    onClick={() =>
                      setActiveImage(
                        image,
                      )
                    }

                    className={[
                      "h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition",

                      activeImage ===
                      image
                        ? "border-[#D4AF37]"
                        : "border-transparent",

                    ].join(" ")}
                  >

                    <img
                      src={
                        image
                      }

                      alt={`${item.title} ${index + 1}`}

                      className="h-full w-full object-cover"
                    />

                  </button>

                ),
              )
            }

          </div>

        )}


        {/* ==================================================
            CONTENT
        =================================================== */}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">

          <section>

            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#9b7e1d]">

                {
                  getCategoryName(
                    item.category,
                  )
                }

              </span>


              {item.featured && (

                <span className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-green-700">

                  Featured Work

                </span>

              )}

            </div>


            <h1 className="mt-5 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">

              {
                item.title
              }

            </h1>


            {item.shortDescription && (

              <p className="mt-5 text-lg leading-8 text-neutral-600">

                {
                  item.shortDescription
                }

              </p>

            )}


            {item.description && (

              <div className="mt-9 whitespace-pre-wrap text-base leading-8 text-neutral-600">

                {
                  item.description
                }

              </div>

            )}


            {/* GALLERY */}

            {item.gallery.length >
              0 && (

              <section className="mt-12">

                <h2 className="text-2xl font-black text-neutral-950">
                  Project Gallery
                </h2>


                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  {
                    item.gallery.map(
                      (
                        image,
                        index,
                      ) => (

                        <button
                          key={
                            `${image}-${index}`
                          }

                          type="button"

                          onClick={() => {

                            setActiveImage(
                              image,
                            );

                            setLightboxOpen(
                              true,
                            );

                          }}

                          className="group overflow-hidden rounded-2xl bg-neutral-100"
                        >

                          <img
                            src={
                              image
                            }

                            alt={`${item.title} gallery ${index + 1}`}

                            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                        </button>

                      ),
                    )
                  }

                </div>

              </section>

            )}

          </section>


          {/* SIDEBAR */}

          <aside className="h-fit rounded-3xl border border-neutral-200 bg-[#faf9f5] p-6">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-white">

                {item.category ===
                "devices" ? (

                  <ImageIcon
                    size={21}
                  />

                ) : (

                  <Globe2
                    size={21}
                  />

                )}

              </div>


              <div>

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Project Type
                </p>


                <p className="mt-1 font-black text-neutral-950">

                  {
                    getCategoryName(
                      item.category,
                    )
                  }

                </p>

              </div>

            </div>


            {/* INDUSTRY */}

            {item.clientIndustry && (

              <div className="mt-6 border-t border-neutral-200 pt-5">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Industry
                </p>


                <p className="mt-2 text-sm font-bold text-neutral-800">

                  {
                    item.clientIndustry
                  }

                </p>

              </div>

            )}


            {/* TECHNOLOGIES */}

            {item.technologies.length >
              0 && (

              <div className="mt-6 border-t border-neutral-200 pt-5">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Technologies / Components
                </p>


                <div className="mt-3 flex flex-wrap gap-2">

                  {
                    item.technologies.map(
                      (
                        technology,
                      ) => (

                        <span
                          key={
                            technology
                          }

                          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-neutral-700"
                        >

                          {
                            technology
                          }

                        </span>

                      ),
                    )
                  }

                </div>

              </div>

            )}


            {/* GALLERY COUNT */}

            <div className="mt-6 border-t border-neutral-200 pt-5">

              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Gallery
              </p>


              <p className="mt-2 text-sm font-bold text-neutral-800">

                {
                  galleryImages.length
                }

                {" "}

                {
                  galleryImages.length ===
                    1
                    ? "image"
                    : "images"
                }

              </p>

            </div>


            {/* WEBSITE */}

            {item.category ===
              "website" &&
              item.liveUrl && (

              <a
                href={
                  item.liveUrl
                }

                target="_blank"

                rel="noreferrer"

                className="mt-7 flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622]"
              >

                Visit Website

                <ExternalLink
                  size={15}
                />

              </a>

            )}

          </aside>

        </div>


        {/* ==================================================
            CTA
        =================================================== */}

        <section className="mt-14 rounded-[2rem] bg-neutral-950 p-8 sm:p-10">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                Build something similar
              </p>


              <h2 className="mt-2 text-2xl font-black text-white">
                Have a project in mind?
              </h2>


              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
                Tell us about your requirements and we will discuss
                the project before preparing a quotation.
              </p>

            </div>


            <Link
              to={
                item.category ===
                  "devices"
                  ? "/custom-solutions/request?type=custom-devices"
                  : "/custom-solutions/request?type=website"
              }

              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white"
            >

              Start a Project

              <ArrowRight
                size={16}
              />

            </Link>

          </div>

        </section>

      </div>


      {/* ====================================================
          LIGHTBOX
      ===================================================== */}

      {lightboxOpen &&
        activeImage && (

        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">

          <button
            type="button"

            aria-label="Close image preview"

            onClick={() =>
              setLightboxOpen(
                false,
              )
            }

            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >

            <X
              size={22}
            />

          </button>


          {galleryImages.length >
            1 && (

            <button
              type="button"

              aria-label="Previous image"

              onClick={
                previousImage
              }

              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:left-8"
            >

              <ArrowLeft
                size={20}
              />

            </button>

          )}


          <img
            src={
              activeImage
            }

            alt={
              item.title
            }

            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
          />


          {galleryImages.length >
            1 && (

            <button
              type="button"

              aria-label="Next image"

              onClick={
                nextImage
              }

              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:right-8"
            >

              <ArrowRight
                size={20}
              />

            </button>

          )}

        </div>

      )}

    </main>
  );
}