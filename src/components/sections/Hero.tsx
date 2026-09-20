import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import type {
  HomepageSettings,
} from "../../types/siteSettings";

import {
  defaultHomepage3DModel,
  type Homepage3DModel,
} from "../../types/homepage3DModel";

import {
  subscribeToHomepage3DModel,
} from "../../services/homepage3DModel.service";

const HomepageSTLViewer =
  lazy(
    () =>
      import(
        "./HomepageSTLViewer"
      ),
  );

interface HeroProps {
  settings: HomepageSettings;
}

export function Hero({
  settings,
}: HeroProps) {
  const primaryLink =
    settings.heroButtonLink ||
    "/products";

  const secondaryLink =
    settings.secondaryButtonLink ||
    "/about";

  const primaryText =
    settings.heroButtonText ||
    "Explore Products";

  const secondaryText =
    settings.secondaryButtonText ||
    "Discover Nexletronics";

  const [
    homepage3DModel,
    setHomepage3DModel,
  ] =
    useState<Homepage3DModel>(
      defaultHomepage3DModel,
    );

  useEffect(() => {
    return subscribeToHomepage3DModel(
      (nextModel) => {
        setHomepage3DModel(
          nextModel,
        );
      },

      (error) => {
        console.error(
          "Homepage 3D model listener failed:",
          error,
        );

        setHomepage3DModel(
          defaultHomepage3DModel,
        );
      },
    );
  }, []);

  const showHomepage3D =
    homepage3DModel.enabled &&
    Boolean(
      homepage3DModel.fileUrl,
    );

  return (
    <section className="relative overflow-hidden bg-white">

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-neutral-100 blur-3xl" />

      </div>

      {/* CONTENT */}

      <div className="container-custom relative grid min-h-[760px] items-center gap-16 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">

        {/* LEFT */}

        <div className="max-w-3xl">

          <div className="inline-flex items-center gap-3 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2">

            <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />

            <span className="text-xs font-black uppercase tracking-[0.22em] text-[#9b7e1d]">
              {settings.heroEyebrow}
            </span>

          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-neutral-950 sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            {settings.heroTitle}
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
            {settings.heroSubtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <Link
              to={primaryLink}
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white shadow-xl shadow-[#D4AF37]/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#b99622]"
            >
              {primaryText}

              <span className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              to={secondaryLink}
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-7 py-4 text-sm font-black text-neutral-900 transition duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[#9b7e1d]"
            >
              {secondaryText}
            </Link>

          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 backdrop-blur">

              <p className="text-2xl font-black text-neutral-950">
                Reliable
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Practical technology built for real projects.
              </p>

            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 backdrop-blur">

              <p className="text-2xl font-black text-neutral-950">
                Flexible
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Products and solutions for makers and businesses.
              </p>

            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 backdrop-blur">

              <p className="text-2xl font-black text-neutral-950">
                Future-ready
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Electronics, embedded systems and innovation.
              </p>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="relative mx-auto w-full max-w-xl lg:mr-0">

          <div className="absolute inset-8 rounded-[3rem] bg-[#D4AF37]/20 blur-3xl" />

          <div className="relative rounded-[3rem] border border-[#D4AF37]/25 bg-white p-4 shadow-[0_30px_100px_rgba(30,30,30,0.12)]">

            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-neutral-950">

              {showHomepage3D ? (

                <Suspense
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-neutral-950">

                      <div className="text-center">

                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#D4AF37]" />

                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                          Loading 3D Model
                        </p>

                      </div>

                    </div>
                  }
                >

                  <HomepageSTLViewer
                    url={
                      homepage3DModel.fileUrl
                    }

                    autoRotate={
                      homepage3DModel.rotationEnabled
                    }

                    rotationSpeed={
                      homepage3DModel.rotationSpeed
                    }

                    zoomEnabled={
                      homepage3DModel.zoomEnabled
                    }

                    zoomLevel={
                      homepage3DModel.zoomLevel
                    }

                    showLoadingLabel={
                      false
                    }
                  />

                </Suspense>

              ) : settings.heroImage ? (

                <img
                  src={
                    settings.heroImage
                  }
                  alt={
                    settings.heroTitle ||
                    "Nexletronics technology"
                  }
                  className="h-full w-full object-cover"
                />

              ) : (

                <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-neutral-950 text-center">

                  <div className="pointer-events-none absolute inset-0 opacity-25">

                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(212,175,55,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.18) 1px, transparent 1px)",

                        backgroundSize:
                          "42px 42px",
                      }}
                    />

                  </div>

                  <div className="relative">

                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-[#D4AF37]/30 bg-[#D4AF37]/10 shadow-[0_0_70px_rgba(212,175,55,0.15)]">

                      <span className="text-6xl font-black text-[#D4AF37]">
                        N
                      </span>

                    </div>

                    <p className="mt-7 text-2xl font-black tracking-[0.16em] text-white">
                      NEXLETRONICS
                    </p>

                    <p className="mt-3 text-sm tracking-[0.18em] text-neutral-400">
                      TECHNOLOGY • INNOVATION • RELIABILITY
                    </p>

                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">

                    <div className="flex items-center gap-2">

                      <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />

                      <span className="text-xs font-bold text-neutral-300">
                        SYSTEM READY
                      </span>

                    </div>

                    <span className="text-xs font-bold text-[#D4AF37]">
                      NXL
                    </span>

                  </div>

                </div>

              )}

            </div>

            {showHomepage3D && (

              <div className="pointer-events-none absolute bottom-8 left-8 right-8 flex items-end justify-between gap-4">

                <div className="max-w-[75%] rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur">

                  <p className="text-sm font-black text-white">
                    {
                      homepage3DModel.title
                    }
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-300">
                    {
                      homepage3DModel.description
                    }
                  </p>

                </div>

                <div className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] backdrop-blur">

                  {homepage3DModel.rotationEnabled
                    ? "Rotating"
                    : "Interactive"}

                </div>

              </div>

            )}

          </div>

          <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-xl sm:block">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-lg text-[#D4AF37]">
                ⚡
              </div>

              <div>

                <p className="text-sm font-black text-neutral-950">
                  Built to perform
                </p>

                <p className="mt-0.5 text-xs text-neutral-500">
                  Electronics • Embedded • Innovation
                </p>

              </div>

            </div>

          </div>

          <div className="absolute -right-3 top-8 hidden rounded-2xl border border-[#D4AF37]/20 bg-white px-4 py-3 shadow-xl sm:block">

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9b7e1d]">
              {showHomepage3D
                ? "3D PRINTED MODEL"
                : "NEXLETRONICS"}
            </p>

            <p className="mt-1 text-sm font-black text-neutral-950">
              {showHomepage3D
                ? "Interactive product view"
                : "Technology for tomorrow"}
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;