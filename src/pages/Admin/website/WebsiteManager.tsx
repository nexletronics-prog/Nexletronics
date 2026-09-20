import {
  Eye,
  Globe,
  Save,
  Settings2,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  defaultHomepageSettings,
  saveHomepageSettings,
  subscribeToHomepageSettings,
} from "../../../services/siteSettings.service";

import {
  defaultGlobalWebsiteSettings,
  saveGlobalWebsiteSettings,
  subscribeToGlobalWebsiteSettings,
} from "../../../services/globalSettings.service";

import type {
  GlobalWebsiteSettings,
  HomepageFeature,
  HomepageSettings,
} from "../../../types/siteSettings";

import Homepage3DModelManager from "./Homepage3DModelManager";


/*
 * ==========================================================
 * WEBSITE MANAGER
 * ==========================================================
 */

export default function WebsiteManager() {

  /*
   * ========================================================
   * HOMEPAGE SETTINGS
   * ========================================================
   */

  const [
    settings,
    setSettings,
  ] = useState<HomepageSettings | null>(
    null,
  );


  /*
   * ========================================================
   * GLOBAL SETTINGS
   * ========================================================
   */

  const [
    globalSettings,
    setGlobalSettings,
  ] = useState<GlobalWebsiteSettings>(
    defaultGlobalWebsiteSettings,
  );


  /*
   * ========================================================
   * UI STATE
   * ========================================================
   */

  const [
    loading,
    setLoading,
  ] = useState<boolean>(
    true,
  );


  const [
    saving,
    setSaving,
  ] = useState<boolean>(
    false,
  );


  const [
    saved,
    setSaved,
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
   * REALTIME WEBSITE SETTINGS
   * ========================================================
   *
   * Homepage:
   *
   *     siteSettings/homepage
   *
   * Global:
   *
   *     siteSettings/global
   *
   * Both listeners stay alive while this admin page is open.
   */

  useEffect(() => {

    let mounted = true;

    let homepageReady = false;

    let globalReady = false;


    function checkReady() {

      if (
        mounted &&
        homepageReady &&
        globalReady
      ) {

        setLoading(
          false,
        );
      }
    }


    /*
     * ======================================================
     * HOMEPAGE LISTENER
     * ======================================================
     */

    const unsubscribeHomepage =
      subscribeToHomepageSettings(

        (
          homepageData,
        ) => {

          if (!mounted) {
            return;
          }


          setSettings(
            homepageData,
          );


          homepageReady =
            true;


          checkReady();

        },

        (
          listenerError,
        ) => {

          console.error(
            "Homepage realtime listener failed:",
            listenerError,
          );


          if (!mounted) {
            return;
          }


          setError(
            listenerError.message,
          );


          setSettings(
            {
              ...defaultHomepageSettings,

              features:
                defaultHomepageSettings.features.map(
                  (
                    feature,
                  ) => ({
                    ...feature,
                  }),
                ),
            },
          );


          homepageReady =
            true;


          checkReady();

        },
      );


    /*
     * ======================================================
     * GLOBAL LISTENER
     * ======================================================
     */

    const unsubscribeGlobal =
      subscribeToGlobalWebsiteSettings(

        (
          globalData,
        ) => {

          if (!mounted) {
            return;
          }


          setGlobalSettings(
            globalData,
          );


          globalReady =
            true;


          checkReady();

        },

        (
          listenerError,
        ) => {

          console.error(
            "Global settings realtime listener failed:",
            listenerError,
          );


          if (!mounted) {
            return;
          }


          setError(
            listenerError.message,
          );


          setGlobalSettings(
            {
              ...defaultGlobalWebsiteSettings,
            },
          );


          globalReady =
            true;


          checkReady();

        },
      );


    /*
     * ======================================================
     * CLEANUP
     * ======================================================
     */

    return () => {

      mounted =
        false;


      unsubscribeHomepage();

      unsubscribeGlobal();

    };

  }, []);


  /*
   * ========================================================
   * UPDATE HOMEPAGE SETTING
   * ========================================================
   */

  function updateSetting<
    K extends keyof HomepageSettings,
  >(
    field: K,
    value: HomepageSettings[K],
  ) {

    setSaved(
      false,
    );


    setError(
      "",
    );


    setSettings(
      (
        current,
      ) =>
        current
          ? {
              ...current,

              [field]:
                value,
            }
          : current,
    );
  }


  /*
   * ========================================================
   * UPDATE GLOBAL SETTING
   * ========================================================
   */

  function updateGlobal<
    K extends keyof GlobalWebsiteSettings,
  >(
    field: K,
    value: GlobalWebsiteSettings[K],
  ) {

    setSaved(
      false,
    );


    setError(
      "",
    );


    setGlobalSettings(
      (
        current,
      ) => ({

        ...current,

        [field]:
          value,

      }),
    );
  }


  /*
   * ========================================================
   * UPDATE FEATURE
   * ========================================================
   */

  function updateFeature(
    index: number,
    field: keyof HomepageFeature,
    value: string,
  ) {

    if (!settings) {
      return;
    }


    const features =
      settings.features.map(
        (
          feature,
          featureIndex,
        ) =>
          featureIndex ===
          index

            ? {
                ...feature,

                [field]:
                  value,
              }

            : feature,
      );


    updateSetting(
      "features",
      features,
    );
  }


  /*
   * ========================================================
   * ADD FEATURE
   * ========================================================
   */

  function addFeature() {

    if (!settings) {
      return;
    }


    const nextNumber =
      String(
        settings.features.length +
          1,
      ).padStart(
        2,
        "0",
      );


    const newFeature:
      HomepageFeature = {

      number:
        nextNumber,

      title:
        "New Feature",

      description:
        "Describe this feature.",
    };


    updateSetting(
      "features",
      [
        ...settings.features,
        newFeature,
      ],
    );
  }


  /*
   * ========================================================
   * REMOVE FEATURE
   * ========================================================
   */

  function removeFeature(
    index: number,
  ) {

    if (!settings) {
      return;
    }


    const features =
      settings.features.filter(
        (
          _,
          featureIndex,
        ) =>
          featureIndex !==
          index,
      );


    updateSetting(
      "features",
      features,
    );
  }


  /*
   * ========================================================
   * SAVE EVERYTHING
   * ========================================================
   */

  async function handleSave() {

    if (!settings) {
      return;
    }


    try {

      setSaving(
        true,
      );

      setSaved(
        false,
      );

      setError(
        "",
      );


      await Promise.all([

        saveHomepageSettings(
          settings,
        ),

        saveGlobalWebsiteSettings(
          globalSettings,
        ),

      ]);


      /*
       * IMPORTANT:
       *
       * We deliberately do NOT call getHomepageSettings()
       * or getGlobalWebsiteSettings() here.
       *
       * Firestore onSnapshot() will receive the updated
       * documents and synchronize the local state.
       */

      setSaved(
        true,
      );

    } catch (err) {

      console.error(
        "Failed to save website settings:",
        err,
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to save website settings.",
      );

    } finally {

      setSaving(
        false,
      );
    }
  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loading ||
    !settings
  ) {

    return (
      <div className="space-y-8">

        <div>

          <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-10 w-72 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-neutral-100" />

        </div>


        <div className="h-[700px] animate-pulse rounded-3xl bg-neutral-100" />

      </div>
    );
  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div className="max-w-5xl space-y-8">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Website Control
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Website
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Manage homepage content and global website
            information without changing source code.
          </p>

        </div>


        <div className="flex flex-wrap items-center gap-3">

          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-green-700">

            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

            Live Firebase Sync

          </div>


          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#D4AF37] sm:self-auto"
          >

            <Eye
              size={16}
            />

            View Website

            <Globe
              size={14}
            />

          </Link>

        </div>

      </div>


      {/* ====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium leading-6 text-red-700"
        >

          {error}

        </div>

      )}


      {/* ====================================================
          SUCCESS
      ===================================================== */}

      {saved && (

        <div
          role="status"
          className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium leading-6 text-green-700"
        >

          Website settings saved successfully.

          <span className="ml-1 font-normal">
            Connected listeners have been updated.
          </span>

        </div>

      )}


      {/* ====================================================
          HERO
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Globe
              size={21}
            />

          </div>


          <div>

            <h2 className="text-xl font-black text-neutral-950">
              Hero Section
            </h2>


            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Control the main homepage banner.
            </p>

          </div>

        </div>


        <div className="mt-7 space-y-5">

          {/* Eyebrow */}

          <div>

            <label
              htmlFor="hero-eyebrow"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Eyebrow
            </label>


            <input
              id="hero-eyebrow"
              type="text"
              value={
                settings.heroEyebrow
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "heroEyebrow",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* Title */}

          <div>

            <label
              htmlFor="hero-title"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Main Heading
            </label>


            <input
              id="hero-title"
              type="text"
              value={
                settings.heroTitle
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "heroTitle",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-lg font-bold outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* Subtitle */}

          <div>

            <label
              htmlFor="hero-subtitle"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Description
            </label>


            <textarea
              id="hero-subtitle"
              rows={4}
              value={
                settings.heroSubtitle
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "heroSubtitle",
                  event.target.value,
                )
              }
              className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm leading-6 outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* Buttons */}

          <div className="grid gap-5 sm:grid-cols-2">

            <div>

              <label
                htmlFor="hero-button-text"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Primary Button Text
              </label>


              <input
                id="hero-button-text"
                value={
                  settings.heroButtonText
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "heroButtonText",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="hero-button-link"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Primary Button Link
              </label>


              <input
                id="hero-button-link"
                value={
                  settings.heroButtonLink
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "heroButtonLink",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="hero-secondary-text"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Secondary Button Text
              </label>


              <input
                id="hero-secondary-text"
                value={
                  settings.secondaryButtonText
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "secondaryButtonText",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="hero-secondary-link"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Secondary Button Link
              </label>


              <input
                id="hero-secondary-link"
                value={
                  settings.secondaryButtonLink
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "secondaryButtonLink",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>

          </div>


          {/* Image */}

          <div>

            <label
              htmlFor="hero-image"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Hero Image URL
            </label>


            <input
              id="hero-image"
              type="url"
              value={
                settings.heroImage ??
                ""
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "heroImage",
                  event.target.value,
                )
              }
              placeholder="https://example.com/hero.jpg"
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            />


            {settings.heroImage && (

              <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">

                <img
                  src={
                    settings.heroImage
                  }
                  alt="Homepage hero preview"
                  className="h-48 w-full object-cover"
                />

              </div>

            )}

          </div>

        </div>

      </section>


      <Homepage3DModelManager />


      {/* ====================================================
          ABOUT
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Settings2
              size={21}
            />

          </div>


          <div>

            <h2 className="text-xl font-black text-neutral-950">
              About Section
            </h2>


            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Control the homepage company introduction.
            </p>

          </div>

        </div>


        <div className="mt-7 space-y-5">

          <div>

            <label
              htmlFor="about-eyebrow"
              className="mb-2 block text-sm font-bold"
            >
              Eyebrow
            </label>


            <input
              id="about-eyebrow"
              value={
                settings.aboutEyebrow
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "aboutEyebrow",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
            />

          </div>


          <div>

            <label
              htmlFor="about-title"
              className="mb-2 block text-sm font-bold"
            >
              Heading
            </label>


            <input
              id="about-title"
              value={
                settings.aboutTitle
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "aboutTitle",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-lg font-bold outline-none focus:border-[#D4AF37]"
            />

          </div>


          <div>

            <label
              htmlFor="about-description"
              className="mb-2 block text-sm font-bold"
            >
              Description
            </label>


            <textarea
              id="about-description"
              rows={5}
              value={
                settings.aboutDescription
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "aboutDescription",
                  event.target.value,
                )
              }
              className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 leading-6 outline-none focus:border-[#D4AF37]"
            />

          </div>


          <div className="grid gap-5 sm:grid-cols-2">

            <div>

              <label
                htmlFor="about-button-text"
                className="mb-2 block text-sm font-bold"
              >
                Button Text
              </label>


              <input
                id="about-button-text"
                value={
                  settings.aboutButtonText
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "aboutButtonText",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="about-button-link"
                className="mb-2 block text-sm font-bold"
              >
                Button Link
              </label>


              <input
                id="about-button-link"
                value={
                  settings.aboutButtonLink
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "aboutButtonLink",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>

          </div>

        </div>

      </section>


      {/* ====================================================
          FEATURES
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <h2 className="text-xl font-black text-neutral-950">
              Features
            </h2>


            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Add, edit or remove feature cards displayed on the homepage.
            </p>

          </div>


          <button
            type="button"
            onClick={
              addFeature
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37] px-5 py-2.5 text-xs font-black text-[#9b7e1d] transition hover:bg-[#D4AF37] hover:text-white"
          >

            <Plus
              size={15}
            />

            Add Feature

          </button>

        </div>


        <div className="mt-7 space-y-5">

          {settings.features.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center">

              <p className="text-sm text-neutral-500">
                No homepage features configured.
              </p>


              <button
                type="button"
                onClick={
                  addFeature
                }
                className="mt-4 rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D4AF37]"
              >
                Add First Feature
              </button>

            </div>

          ) : (

            settings.features.map(
              (
                feature,
                index,
              ) => (

                <div
                  key={`${feature.number}-${index}`}
                  className="rounded-2xl border border-neutral-200 p-5"
                >

                  <div className="flex flex-col gap-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">

                          Feature{" "}

                          {index + 1}

                        </p>


                        <h3 className="mt-1 font-black text-neutral-950">

                          {
                            feature.title ||
                            "Untitled Feature"
                          }

                        </h3>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          removeFeature(
                            index,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                      >

                        <Trash2
                          size={13}
                        />

                        Remove

                      </button>

                    </div>


                    <div className="grid gap-4 sm:grid-cols-[100px_1fr]">

                      <div>

                        <label
                          htmlFor={`feature-number-${index}`}
                          className="mb-2 block text-xs font-bold text-neutral-700"
                        >
                          Number
                        </label>


                        <input
                          id={`feature-number-${index}`}
                          value={
                            feature.number
                          }
                          onChange={(
                            event,
                          ) =>
                            updateFeature(
                              index,
                              "number",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                        />

                      </div>


                      <div>

                        <label
                          htmlFor={`feature-title-${index}`}
                          className="mb-2 block text-xs font-bold text-neutral-700"
                        >
                          Title
                        </label>


                        <input
                          id={`feature-title-${index}`}
                          value={
                            feature.title
                          }
                          onChange={(
                            event,
                          ) =>
                            updateFeature(
                              index,
                              "title",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4AF37]"
                        />

                      </div>

                    </div>


                    <div>

                      <label
                        htmlFor={`feature-description-${index}`}
                        className="mb-2 block text-xs font-bold text-neutral-700"
                      >
                        Description
                      </label>


                      <textarea
                        id={`feature-description-${index}`}
                        rows={3}
                        value={
                          feature.description
                        }
                        onChange={(
                          event,
                        ) =>
                          updateFeature(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                        className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-6 outline-none focus:border-[#D4AF37]"
                      />

                    </div>

                  </div>

                </div>

              ),
            )

          )}

        </div>

      </section>


      {/* ====================================================
          CTA
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div>

          <h2 className="text-xl font-black text-neutral-950">
            Call To Action
          </h2>


          <p className="mt-1 text-sm leading-6 text-neutral-500">
            Control the final promotional section.
          </p>

        </div>


        <div className="mt-7 space-y-5">

          <div>

            <label
              htmlFor="cta-eyebrow"
              className="mb-2 block text-sm font-bold"
            >
              Eyebrow
            </label>


            <input
              id="cta-eyebrow"
              value={
                settings.ctaEyebrow
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "ctaEyebrow",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
            />

          </div>


          <div>

            <label
              htmlFor="cta-title"
              className="mb-2 block text-sm font-bold"
            >
              Heading
            </label>


            <input
              id="cta-title"
              value={
                settings.ctaTitle
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "ctaTitle",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-lg font-bold outline-none focus:border-[#D4AF37]"
            />

          </div>


          <div>

            <label
              htmlFor="cta-description"
              className="mb-2 block text-sm font-bold"
            >
              Description
            </label>


            <textarea
              id="cta-description"
              rows={4}
              value={
                settings.ctaDescription
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "ctaDescription",
                  event.target.value,
                )
              }
              className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 leading-6 outline-none focus:border-[#D4AF37]"
            />

          </div>


          <div className="grid gap-5 sm:grid-cols-2">

            <div>

              <label
                htmlFor="cta-button-text"
                className="mb-2 block text-sm font-bold"
              >
                Button Text
              </label>


              <input
                id="cta-button-text"
                value={
                  settings.ctaButtonText
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "ctaButtonText",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="cta-button-link"
                className="mb-2 block text-sm font-bold"
              >
                Button Link
              </label>


              <input
                id="cta-button-link"
                value={
                  settings.ctaButtonLink
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "ctaButtonLink",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 outline-none focus:border-[#D4AF37]"
              />

            </div>

          </div>

        </div>

      </section>


      {/* ====================================================
          GLOBAL WEBSITE INFORMATION
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Settings2
              size={21}
            />

          </div>


          <div>

            <h2 className="text-xl font-black text-neutral-950">
              Global Website Information
            </h2>


            <p className="mt-1 text-sm leading-6 text-neutral-500">
              These values are used throughout the public
              website, especially the footer and contact areas.
            </p>

          </div>

        </div>


        <div className="mt-7 grid gap-5 sm:grid-cols-2">

          {/* Company */}

          <div>

            <label
              htmlFor="company-name"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Company Name
            </label>


            <input
              id="company-name"
              type="text"
              value={
                globalSettings.companyName
              }
              onChange={(
                event,
              ) =>
                updateGlobal(
                  "companyName",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            />

          </div>


          {/* Email */}

          <div>

            <label
              htmlFor="company-email"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Email
            </label>


            <input
              id="company-email"
              type="email"
              value={
                globalSettings.companyEmail
              }
              onChange={(
                event,
              ) =>
                updateGlobal(
                  "companyEmail",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            />

          </div>


          {/* Phone */}

          <div>

            <label
              htmlFor="company-phone"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Phone
            </label>


            <input
              id="company-phone"
              type="tel"
              value={
                globalSettings.companyPhone
              }
              onChange={(
                event,
              ) =>
                updateGlobal(
                  "companyPhone",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            />

          </div>


          {/* Address */}

          <div>

            <label
              htmlFor="company-address"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Address
            </label>


            <input
              id="company-address"
              type="text"
              value={
                globalSettings.companyAddress
              }
              onChange={(
                event,
              ) =>
                updateGlobal(
                  "companyAddress",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
            />

          </div>


          {/* Footer description */}

          <div className="sm:col-span-2">

            <label
              htmlFor="footer-description"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Footer Description
            </label>


            <textarea
              id="footer-description"
              rows={4}
              value={
                globalSettings.footerDescription
              }
              onChange={(
                event,
              ) =>
                updateGlobal(
                  "footerDescription",
                  event.target.value,
                )
              }
              className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm leading-6 outline-none focus:border-[#D4AF37]"
            />

          </div>

        </div>


        {/* Social Links */}

        <div className="mt-8">

          <h3 className="text-sm font-black text-neutral-950">
            Social Links
          </h3>


          <div className="mt-4 grid gap-5 sm:grid-cols-2">

            <div>

              <label
                htmlFor="instagram-url"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Instagram
              </label>


              <input
                id="instagram-url"
                type="url"
                value={
                  globalSettings.instagramUrl
                }
                onChange={(
                  event,
                ) =>
                  updateGlobal(
                    "instagramUrl",
                    event.target.value,
                  )
                }
                placeholder="https://instagram.com/..."
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="facebook-url"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Facebook
              </label>


              <input
                id="facebook-url"
                type="url"
                value={
                  globalSettings.facebookUrl
                }
                onChange={(
                  event,
                ) =>
                  updateGlobal(
                    "facebookUrl",
                    event.target.value,
                  )
                }
                placeholder="https://facebook.com/..."
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="youtube-url"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                YouTube
              </label>


              <input
                id="youtube-url"
                type="url"
                value={
                  globalSettings.youtubeUrl
                }
                onChange={(
                  event,
                ) =>
                  updateGlobal(
                    "youtubeUrl",
                    event.target.value,
                  )
                }
                placeholder="https://youtube.com/..."
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>


            <div>

              <label
                htmlFor="linkedin-url"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                LinkedIn
              </label>


              <input
                id="linkedin-url"
                type="url"
                value={
                  globalSettings.linkedinUrl
                }
                onChange={(
                  event,
                ) =>
                  updateGlobal(
                    "linkedinUrl",
                    event.target.value,
                  )
                }
                placeholder="https://linkedin.com/..."
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>

          </div>

        </div>


        {/* Copyright */}

        <div className="mt-7">

          <label
            htmlFor="copyright-text"
            className="mb-2 block text-sm font-bold text-neutral-800"
          >
            Copyright Text
          </label>


          <input
            id="copyright-text"
            type="text"
            value={
              globalSettings.copyrightText
            }
            onChange={(
              event,
            ) =>
              updateGlobal(
                "copyrightText",
                event.target.value,
              )
            }
            placeholder="Nexletronics. All rights reserved."
            className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
          />

        </div>

      </section>


      {/* ====================================================
          SECTION VISIBILITY
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

        <div>

          <h2 className="text-xl font-black text-neutral-950">
            Section Visibility
          </h2>


          <p className="mt-1 text-sm leading-6 text-neutral-500">
            Turn homepage sections on or off without deleting
            their content.
          </p>

        </div>


        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          {/* Features */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="text-sm font-bold text-neutral-900">
                Features
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Show homepage feature cards.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.showFeatures
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "showFeatures",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>


          {/* About */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="text-sm font-bold text-neutral-900">
                About
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Show homepage About section.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.showAbout
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "showAbout",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>


          {/* Products */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="text-sm font-bold text-neutral-900">
                Products
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Show products on the homepage.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.showProducts
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "showProducts",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>


          {/* Services */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50">

            <div>

              <p className="text-sm font-bold text-neutral-900">
                Services
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Control homepage services visibility.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.showServices
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "showServices",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>


          {/* CTA */}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4 transition hover:border-[#D4AF37]/50 sm:col-span-2">

            <div>

              <p className="text-sm font-bold text-neutral-900">
                Call To Action
              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Show the final CTA section.
              </p>

            </div>


            <input
              type="checkbox"
              checked={
                settings.showCTA
              }
              onChange={(
                event,
              ) =>
                updateSetting(
                  "showCTA",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-[#D4AF37]"
            />

          </label>

        </div>

      </section>


      {/* ====================================================
          SAVE BAR
      ===================================================== */}

      <div className="sticky bottom-5 z-20 rounded-3xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-bold text-neutral-900">
              Website Settings
            </p>


            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Save changes to update your public website.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              void handleSave()
            }
            disabled={
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Save
              size={17}
            />

            {saving
              ? "Saving..."
              : "Save Website Changes"}

          </button>

        </div>

      </div>

    </div>
  );
}