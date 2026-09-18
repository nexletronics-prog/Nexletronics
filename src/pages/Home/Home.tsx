import {
  useEffect,
  useState,
} from "react";

import {
  AboutPreview,
} from "../../components/sections/AboutPreview";

import {
  CTA,
} from "../../components/sections/CTA";

import {
  Features,
} from "../../components/sections/Features";

import {
  Hero,
} from "../../components/sections/Hero";

import {
  ProductsPreview,
} from "../../components/sections/ProductsPreview";

import {
  LoadingSpinner,
} from "../../components/common/LoadingSpinner";

import {
  defaultHomepageSettings,
  subscribeToHomepageSettings,
} from "../../services/siteSettings.service";

import type {
  HomepageSettings,
} from "../../types/siteSettings";


/*
 * ==========================================================
 * HOME
 * ==========================================================
 *
 * Homepage content is now synchronized directly with:
 *
 *     siteSettings/homepage
 *
 * through Firestore onSnapshot().
 *
 * This means an already-open homepage receives Website Manager
 * changes without a browser refresh.
 */

export default function Home() {

  const [
    settings,
    setSettings,
  ] = useState<HomepageSettings>(
    defaultHomepageSettings,
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string>("");


  /*
   * ========================================================
   * REALTIME HOMEPAGE SETTINGS
   * ========================================================
   */

  useEffect(() => {

    let mounted = true;


    const unsubscribe =
      subscribeToHomepageSettings(

        (
          nextSettings,
        ) => {

          if (!mounted) {
            return;
          }


          setSettings(
            nextSettings,
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

          if (!mounted) {
            return;
          }


          console.error(
            "Realtime homepage settings failed:",
            listenerError,
          );


          /*
           * Keep the homepage usable with defaults if the
           * Firestore listener temporarily fails.
           */

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


          setError(
            listenerError.message,
          );


          setLoading(
            false,
          );
        },
      );


    return () => {

      mounted = false;

      unsubscribe();

    };

  }, []);


  /*
   * ========================================================
   * INITIAL LOADING
   * ========================================================
   */

  if (loading) {

    return (
      <section className="min-h-[70vh] bg-white">

        <div className="container-custom flex min-h-[70vh] items-center justify-center">

          <LoadingSpinner />

        </div>

      </section>
    );
  }


  return (
    <>

      {/* ==================================================
          REALTIME CONNECTION WARNING
      =================================================== */}

      {error && (

        <div className="container-custom pt-4">

          <div
            role="status"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700"
          >
            Live homepage synchronization is temporarily
            unavailable. Default content is being displayed.
          </div>

        </div>

      )}


      {/* ==================================================
          HERO
      =================================================== */}

      <Hero
        settings={
          settings
        }
      />


      {/* ==================================================
          FEATURES
      =================================================== */}

      {settings.showFeatures && (
        <Features />
      )}


      {/* ==================================================
          ABOUT
      =================================================== */}

      {settings.showAbout && (
        <AboutPreview />
      )}


      {/* ==================================================
          PRODUCTS
      =================================================== */}

      {settings.showProducts && (
        <ProductsPreview />
      )}


      {/* ==================================================
          SERVICES
      =================================================== */}

      {settings.showServices && (
        <section
          id="services"
          className="sr-only"
          aria-hidden="true"
        />
      )}


      {/* ==================================================
          CTA
      =================================================== */}

      {settings.showCTA && (
        <CTA />
      )}

    </>
  );
}