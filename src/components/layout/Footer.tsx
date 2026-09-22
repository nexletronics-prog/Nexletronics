import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  defaultGlobalWebsiteSettings,
} from "../../services/globalSettings.service";

import {
  useGlobalWebsiteSettings,
} from "../../hooks/useGlobalWebsiteSettings";

import type {
  GlobalWebsiteSettings,
} from "../../types/siteSettings";


/*
 * ==========================================================
 * FOOTER
 * ==========================================================
 *
 * Global website information comes from:
 *
 *     siteSettings/global
 *
 * through useGlobalWebsiteSettings().
 *
 * The old Services link has been replaced with 3D Printing.
 */

export default function Footer() {

  const {
    settings: liveSettings,

    error,
  } =
    useGlobalWebsiteSettings();


  const [
    settings,

    setSettings,
  ] =
    useState<GlobalWebsiteSettings>(
      defaultGlobalWebsiteSettings,
    );


  /*
   * ========================================================
   * SYNC REALTIME SETTINGS
   * ========================================================
   */

  useEffect(() => {

    setSettings(
      liveSettings,
    );

  }, [
    liveSettings,
  ]);


  /*
   * ========================================================
   * YEAR
   * ========================================================
   */

  const currentYear =
    new Date().getFullYear();


  /*
   * ========================================================
   * COMPANY NAME
   * ========================================================
   */

  const companyName =
    settings.companyName.trim() ||
    "Nexletronics";


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-white">

      {/* ==================================================
          REALTIME ERROR
      =================================================== */}

      {error && (

        <div className="border-b border-amber-500/20 bg-amber-500/10">

          <div className="container-custom py-2 text-center text-[11px] font-medium text-amber-300">

            Live website settings are temporarily unavailable.
            Showing the latest available information.

          </div>

        </div>

      )}


      {/* ==================================================
          MAIN FOOTER
      =================================================== */}

      <div className="container-custom py-14">

        <div className="grid gap-10 md:grid-cols-4">

          {/* =================================================
              COMPANY
          ================================================== */}

          <div className="md:col-span-2">

            <Link
              to="/"

              className="inline-block text-2xl font-black tracking-tight text-[#D4AF37]"
            >

              {
                companyName
              }

            </Link>


            <p className="mt-5 max-w-md text-sm leading-7 text-neutral-400">

              {
                settings.footerDescription
              }

            </p>


            {/* =================================================
                SOCIAL LINKS
            ================================================== */}

            <div className="mt-6 flex flex-wrap gap-2">

              {settings.instagramUrl && (

                <a
                  href={
                    settings.instagramUrl
                  }

                  target="_blank"

                  rel="noreferrer"

                  aria-label="Instagram"

                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-neutral-400 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >

                  Instagram

                </a>

              )}


              {settings.facebookUrl && (

                <a
                  href={
                    settings.facebookUrl
                  }

                  target="_blank"

                  rel="noreferrer"

                  aria-label="Facebook"

                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-neutral-400 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >

                  Facebook

                </a>

              )}


              {settings.youtubeUrl && (

                <a
                  href={
                    settings.youtubeUrl
                  }

                  target="_blank"

                  rel="noreferrer"

                  aria-label="YouTube"

                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-neutral-400 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >

                  YouTube

                </a>

              )}


              {settings.linkedinUrl && (

                <a
                  href={
                    settings.linkedinUrl
                  }

                  target="_blank"

                  rel="noreferrer"

                  aria-label="LinkedIn"

                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-neutral-400 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >

                  LinkedIn

                </a>

              )}

            </div>

          </div>


          {/* =================================================
              QUICK LINKS
          ================================================== */}

          <div>

            <h3 className="font-bold text-white">

              Quick Links

            </h3>


            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-400">

              <Link
                to="/"

                className="transition hover:text-[#D4AF37]"
              >

                Home

              </Link>


              <Link
                to="/about"

                className="transition hover:text-[#D4AF37]"
              >

                About

              </Link>


              <Link
                to="/products"

                className="transition hover:text-[#D4AF37]"
              >

                Products

              </Link>


              {/* =================================================
                  NEW 3D PRINTING LINK
              ================================================== */}

              <Link
                to="/3d-printing"

                className="transition hover:text-[#D4AF37]"
              >

                3D Printing

              </Link>


              <Link
                to="/contact"

                className="transition hover:text-[#D4AF37]"
              >

                Contact

              </Link>

            </div>

          </div>


          {/* =================================================
              CONTACT
          ================================================== */}

          <div>

            <h3 className="font-bold text-white">

              Contact

            </h3>


            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-400">

              {settings.companyEmail && (

                <p>

                  <span className="text-neutral-500">
                    Email
                  </span>

                  <br />

                  <a
                    href={`mailto:${settings.companyEmail}`}

                    className="transition hover:text-[#D4AF37]"
                  >

                    {
                      settings.companyEmail
                    }

                  </a>

                </p>

              )}


              {settings.companyPhone && (

                <p>

                  <span className="text-neutral-500">
                    Phone
                  </span>

                  <br />

                  <a
                    href={`tel:${settings.companyPhone.replace(
                      /\s+/g,
                      "",
                    )}`}

                    className="transition hover:text-[#D4AF37]"
                  >

                    {
                      settings.companyPhone
                    }

                  </a>

                </p>

              )}


              {settings.companyAddress && (

                <p>

                  <span className="text-neutral-500">
                    Address
                  </span>

                  <br />

                  {
                    settings.companyAddress
                  }

                </p>

              )}

            </div>

          </div>

        </div>

      </div>


      {/* ====================================================
          COPYRIGHT
      ===================================================== */}

      <div className="border-t border-white/10">

        <div className="container-custom flex flex-col gap-2 py-5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">

          <p>

            ©{" "}

            {
              currentYear
            }{" "}

            {
              settings.copyrightText
            }

          </p>


          <div className="flex gap-5">

            <Link
              to="/products"

              className="transition hover:text-white"
            >

              Products

            </Link>


            <Link
              to="/3d-printing"

              className="transition hover:text-white"
            >

              3D Printing

            </Link>


            <Link
              to="/contact"

              className="transition hover:text-white"
            >

              Contact

            </Link>

          </div>

        </div>

      </div>
<div className="flex flex-wrap gap-5 text-sm text-neutral-500">
  <Link
    to="/terms"
    className="hover:text-[#D4AF37]"
  >
    Terms & Conditions
  </Link>

  <Link
    to="/privacy"
    className="hover:text-[#D4AF37]"
  >
    Privacy Policy
  </Link>

  <Link
    to="/refund-policy"
    className="hover:text-[#D4AF37]"
  >
    Refund Policy
  </Link>

  <Link
    to="/shipping-policy"
    className="hover:text-[#D4AF37]"
  >
    Shipping Policy
  </Link>
</div>
    </footer>
  );
}